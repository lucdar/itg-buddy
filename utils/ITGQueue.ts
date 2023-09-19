import { EmbedBuilder } from "discord.js";

/**
 * A two-column queue for representing players waiting in line to play.
 * The left column is for the p1 side, and the right column is for the p2 side.
 */
export class ITGQueue {
  private p1q: (String | null)[];
  private p2q: (String | null)[];
  length: number;
  constructor() {
    this.p1q = [];
    this.p2q = [];
    this.length = 0;
  }
  /**
   * Get the row of the queue from the given position.
   * @param i position in the queue
   */
  public get(i: number): [String | null, String | null] {
    if (i >= this.length) {
      console.error("Index out of bounds");
      throw new Error("Index out of bounds");
    }
    return [this.p1q[i], this.p2q[i]];
  }
  /**
   * Add a player to the queue such that pad side is respected and wait time is minimized.
   * @param player player name to add to the queue
   * @optional side "p1", "p2"
   */
  public join(player: String, side: "p1" | "p2" | null = null) {
    if (player === "") {
      throw new Error("Player name cannot be empty");
    }
    // Iterate through the queue and find an empty spot
    for (let i = 0; i < this.length; i++) {
      const row = this.get(i);
      const p1 = row[0];
      const p2 = row[1];
      if (p1 === null && side !== "p2") {
        this.p1q[i] = player;
        return;
      }
      if (p2 === null && side !== "p1") {
        this.p2q[i] = player;
        return;
      }
    }
    // If the queue is full, add the player to a new row at the end
    // Default to p1 side if no side is specified
    if (side === "p2") {
      this.p1q.push(null);
      this.p2q.push(player);
    } else {
      this.p1q.push(player);
      this.p2q.push(null);
    }
    this.length++;
  }
  /**
   * Join at a specific position in the queue.
   * Throws an error if the position is already occupied.
   * @param player name of the player to add to the queue
   * @param i index of the row to join in the queue
   * @param side "p1" or "p2"
   */
  public joinAt(player: String, i: number, side: "p1" | "p2") {
    if (i > this.length) {
      throw new Error("Index out of bounds");
    }
    if (player === "") {
      throw new Error("Player name cannot be empty");
    }
    if (this.get(i)[side === "p1" ? 0 : 1] !== null) {
      throw new Error("Cannot join at an occupied position");
    }
    // Increase the length of the queue if the player is joining at the end
    if (i === this.length) {
      this.p1q.push(null);
      this.p2q.push(null);
      this.length++;
    }
    if (side === "p1") {
      this.p1q[i] = player;
    } else {
      this.p2q[i] = player;
    }
  }
  /**
   * Pop the first row of the queue and return it.
   * @returns the first row of the queue and removes it from the queue
   */
  public pop(): [String | null, String | null] {
    const row = this.get(0);
    this.p1q.shift();
    this.p2q.shift();
    this.length--;
    return row;
  }
  /**
   * Remove the player in the queue at a specific position.
   * @param i index of the row to leave
   * @param side side to leave, "p1" or "p2"
   */
  public remove(i: number, side: "p1" | "p2") {
    if (side === "p1") {
      this.p1q[i] = null;
    } else {
      this.p2q[i] = null;
    }
    if (this.p1q[0] == null && this.p2q[1] == null) {
      this.p1q.splice(i, 1);
      this.p2q.splice(i, 1);
      this.length--;
    }
  }
  /**
   * Returns an Embed representation of the queue.
   */
  public toEmbed(): EmbedBuilder {
    const embed = new EmbedBuilder().setColor("#0099ff").setTitle("ITG Queue");

    if (this.length === 0) {
      embed.setDescription("The queue is empty.");
      return embed;
    }

    embed.addFields(
      {
        name: "#",
        value: [...Array(this.length).keys()].map((i) => i + 1).join("\n"),
        inline: true,
      },
      {
        name: "P1",
        value: this.p1q.map((p) => p ?? " ").join("\n"),
        inline: true,
      },
      {
        name: "P2",
        value: this.p2q.map((p) => p ?? " ").join("\n"),
        inline: true,
      }
    );
    return embed;
  }

  public swap(i: number, iSide: "p1" | "p2", j: number, jSide: "p1" | "p2") {
    if (i > this.length || j > this.length) {
      throw new Error("Index out of bounds");
    }
    const piq = iSide === "p1" ? this.p1q : this.p2q;
    const pjq = jSide === "p1" ? this.p1q : this.p1q;
    const pi = piq[i];
    const pj = pjq[j];
    piq[i] = pj;
    pjq[j] = pi;
  }

  public clear() {
    this.p1q = [];
    this.p2q = [];
    this.length = 0;
  }

  /**
   * Get a string representation of the queue.
   * @returns a string representation of the queue
   */
  public toString(): String {
    // Calculate max width of each column, row labels, and the queue as a whole
    const qWidth = (x: String | null) => x?.length ?? 0;
    const p1Width = Math.max(...this.p1q.map(qWidth), 3); // 3 is the length of "p1 "
    const p2Width = Math.max(...this.p2q.map(qWidth), 2); // 2 is the length of "p2"
    const labelWidth = this.length.toString().length + 2; // 2 is the length of ". "
    const maxWidth = p1Width + p2Width + labelWidth + 2; // add 2 for rounding/spaces
    // Construct the string line by line
    const hashes = "#".repeat((maxWidth - 10) / 2);
    let str = `${hashes} ITGQueue ${hashes}\n`;
    str += `${" ".repeat(labelWidth)}p1 ${" ".repeat(p1Width - 2)} p2\n`;
    for (let i = 0; i < this.length; i++) {
      const row = this.get(i);
      const labelSpaces = " ".repeat(
        labelWidth - 2 - (i + 1).toString().length
      );
      const spaces = " ".repeat(p1Width - (row[0]?.length ?? 0) + 1);
      str += `${labelSpaces}${i + 1}. `;
      str += (row[0] ?? "") + spaces + (row[1] ?? "") + "\n";
    }
    return str;
  }
}

export const globalQueue = new ITGQueue();
// Sample for testing :)
// globalQueue.join("Rohit");
// globalQueue.join("Lucas");
// globalQueue.join("Steph", "p2");
// globalQueue.join("Katie", "p2");
// globalQueue.join("Will", "p1");
