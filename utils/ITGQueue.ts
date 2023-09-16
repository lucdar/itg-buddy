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
    const isP1 = side === "p1" || side === null; // equivalent to side !== "p2"
    this.p1q.push(isP1 ? player : null);
    this.p2q.push(isP1 ? null : player);
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
    if (player === "") {
      throw new Error("Player name cannot be empty");
    }
    if (this.get(i)[side === "p1" ? 0 : 1] !== null) {
      throw new Error("Cannot join at an occupied position");
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
   * Swap two players in the queue.
   * @param i row index of the first player
   * @param s1 side of the first player
   * @param j row index of the second player
   * @param s2 side of the second player
   */
  public swap(i: number, s1: "p1" | "p2", j: number, s2: "p1" | "p2") {
    const a = this.get(i)[s1 === "p1" ? 0 : 1];
    const b = this.get(j)[s2 === "p1" ? 0 : 1];
    // If both players are null, do nothing
    if (a === null && b === null) {
      return;
    }
    // Put player b in player a's spot
    if (s1 == "p1") {
      this.p1q[i] = b;
    } else {
      this.p2q[i] = b;
    }
    // Put player a in player b's spot
    if (s2 == "p1") {
      this.p1q[j] = a;
    } else {
      this.p2q[j] = a;
    }
    // Check for null rows and remove them
    if (this.p1q[i] == null && this.p2q[i] == null) {
      this.p1q.splice(i, 1);
      this.p2q.splice(i, 1);
      this.length--;
    }
    if (this.p1q[j] == null && this.p2q[j] == null) {
      this.p1q.splice(j, 1);
      this.p2q.splice(j, 1);
      this.length--;
    }
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
