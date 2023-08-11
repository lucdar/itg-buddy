// Generate and export an object with the contents of the config.yaml file
// This is a singleton object, so it will be cached after the first import
// and subsequent imports will return the same object

const yaml = require("js-yaml");
const fs = require("fs");

// Use config.yaml if it exists, otherwise use config-template.yaml
let configPath: string;
if (fs.existsSync("config.yaml")) {
  configPath = "config.yaml";
} else if (fs.existsSync("config-template.yaml")) {
  configPath = "config-template.yaml";
} else {
  console.error("No config file found!");
  process.exit(1);
}

export class Config {
  token: string;
  clientId: string;
  guildId: string;
  addSongChannel: string;
  saveFolder: string | null;

  constructor(configPath: string) {
    let config: any = yaml.load(fs.readFileSync(configPath, "utf8"));
    console.log(`Loaded config from ${configPath}`);

    this.token = config.token;
    this.clientId = config.clientId;
    this.guildId = config.guildId;
    this.addSongChannel = config.addSongChannel;
    this.saveFolder = config.saveFolder;
    // Using == because I'm not sure how yaml loads undefined values
    if (this.saveFolder == undefined) {
      this.saveFolder = null;
    }

    // Check for missing required values
    for (const [key, value] of Object.entries(this)) {
      if (value === undefined) {
        console.error(`Missing required config value: ${key}`);
        process.exit(1);
      }
    }
  }
}

const config = new Config(configPath);
export default config;
