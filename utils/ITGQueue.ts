/**
 * A two-column queue for representing players waiting in line to play.
 * The left column is for the p1 side, and the right column is for the p2 side.
 */
export class ITGQueue {
  p1q: (String | null)[];
  p2q: (String | null)[];
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
    this.p1q.push(player);
    this.p2q.push(null);
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
}