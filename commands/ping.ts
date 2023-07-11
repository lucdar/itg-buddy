import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command } from "../utils/Interfaces";
import { spawn } from "child_process";

/**
 * Ping command to test connection from bot to itg-cli-server to itg-cli and back.
 */
const name = "ping";
const description = "Tests the connection from bot to cli.";

export const ping: Command = {
  data: new SlashCommandBuilder().setName(name).setDescription(description),
  async execute(interaction: ChatInputCommandInteraction) {
    return new Promise(async (resolve, reject) => {
      console.log("Ping: executing command");
      await interaction.reply("Pinging...");
      const cli = spawn("python3", ["../itg-cli/main.py", "ping"]);
      cli.stdout.on("data", (output: String) => {
        // 'data' event happens when python process prints to stdout
        if (output.toString().indexOf("pong") !== -1) {
          console.log("Ping: Pong received from cli!");
          interaction.editReply("Pong!");
          resolve();
        } else {
          console.log("Ping: did not receive pong from cli");
          interaction.editReply(
            "Did not receive pong from cli" + output.toString()
          );
          reject(output.toString());
        }
      });
    });
  },
};
