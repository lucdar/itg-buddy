import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command } from "../utils/Interfaces";
import { spawn } from "child_process";
import config from "../config";

/**
 * Runs the doorbell.sh script to notify players that someone is at the door.
 */
const name = "door";
const description = "Rings the doorbell notification on the machine.";

export const ping: Command = {
  data: new SlashCommandBuilder()
    .setName(name)
    .setDescription(description)
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("The link to the pack to add.")
        .setRequired(false)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    return new Promise(async (resolve, reject) => {
      console.log("Door: executing command");
      await interaction.reply("Ringing doorbell...");
      let doorbell_message = interaction.options.getString("message") || "";
      const cli = spawn(config.doorbellPath, [
        interaction.user.displayName,
        `"${doorbell_message}"`,
      ]);
      // Pass output to the console
      cli.stdout.on("data", (data: any) => {
        const output: String = data.toString();
        console.log(`Door: stdout: ${output}`);
      });

      cli.on("close", (code: number) => {
        if (code === 0) {
          console.log("Door: Doorbell rung successfully!");
          interaction.editReply("Ding Dong! Sent a message to the machine.");
          resolve();
        } else {
          const adminID = config.adminID;
          console.log("Door: did not receive pong from cli");
          interaction.editReply(
            "Uh Oh! Something went wrong.".concat(
              `Pinging @<${adminID}> for help.`
            )
          );
          reject(`Exited with code ${code}`);
        }
      });
    });
  },
};
