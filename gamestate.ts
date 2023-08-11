import chokidar from "chokidar";
import config from "./config";
import path from "path";
import fs from "fs";

// Watch the Save folder for changes to CurrentScreen.txt and SongInfo.txt.
// When they change, update the gamestate and run the callback.
export function watchGamestate(callback: (gamestate: any) => void) {
  // OS agnostic path join
  if (config.saveFolder === null) {
    console.error("No save folder specified! Gamestate is disabled.");
    return;
  }
  const currentScreenPath = path.join(config.saveFolder, "CurrentScreen.txt");

  const watcher = chokidar.watch(currentScreenPath, {
    persistent: true,
  });

  watcher.on("change", (path) => {
    if (path.includes("")) {
      const gamestate = new Gamestate();
      callback(gamestate);
    }
  });
}

export interface SongInfo {
  title: string;
  artist: string;
  pack: string;
  length: string;
  diff: string;
  steps: string;
}

export class Gamestate {
  timestamp: Date = new Date();
  currentScreen: string;
  songInfo: SongInfo | null;

  constructor() {
    if (config.saveFolder === null) {
      console.error("No save folder specified! Gamestate is disabled.");
      this.currentScreen = "";
      this.songInfo = null;
      return;
    }

    const currentScreenPath = path.join(config.saveFolder, "CurrentScreen.txt");
    this.currentScreen = fs.readFileSync(currentScreenPath, "utf8");

    // Only parse song info in gameplay or evaluation screens
    if (
      this.currentScreen !== "ScreenGameplay" &&
      this.currentScreen !== "ScreenEvaluationStage"
    ) {
      this.songInfo = null;
      return;
    }

    // TODO: figure out a better parsing method
    // Example SongInfo:
    // SONG: Doing the Things | ARTIST: Louis cole | PACK: lucdarts | DIFF: 12 [lucdar] | STEPS:  287 | LENGTH: 1:06 |
    const songInfoPath = path.join(config.saveFolder, "SongInfo.txt");
    const songInfoFile = fs.readFileSync(songInfoPath, "utf8");
    const songInfoLines = songInfoFile.split(" | ");
    this.songInfo = {
      title: songInfoLines[0].split(": ")[1],
      artist: songInfoLines[1].split(": ")[1],
      pack: songInfoLines[2].split(": ")[1],
      diff: songInfoLines[3].split(": ")[1],
      steps: songInfoLines[4].split(": ")[1],
      length: songInfoLines[5].split(": ")[1],
    };
  }
}