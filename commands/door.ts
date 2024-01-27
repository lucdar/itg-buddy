import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  User,
} from "discord.js";
import { Command } from "../utils/Interfaces";
import { spawn } from "child_process";
import config from "../config";

/**
 * Runs the doorbell.sh script to notify players that someone is at the door.
 */
const name = "door";
const description = "Rings the doorbell notification on the machine.";

export const door: Command = {
  data: new SlashCommandBuilder()
    .setName(name)
    .setDescription(description)
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("Message to display in the notification.")
        .setRequired(false)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    return new Promise(async (resolve, reject) => {
      console.log("Door: executing command");
      await interaction.reply("Ringing doorbell...");
      let doorbellMessage = interaction.options.getString("message") || "";
      const cli = spawn(config.doorbellPath, [
        interaction.user.username,
        `"${doorbellMessage}"`,
      ]);
      // Pass output to the console
      cli.stdout.on("data", (data: any) => {
        const output: String = data.toString();
        console.log(`Door: stdout: ${output}`);
      });

      cli.on("close", (code: number) => {
        if (code === 0) {
          console.log("Door: Doorbell rung successfully!");
          interaction.editReply(
            "Sent a notification to the machine".concat(
              doorbellMessage ? `: \`${doorbellMessage}\`.` : "."
            )
          );
          resolve();
        } else {
          const admin = interaction.guild?.members.cache.get(config.adminID);
          console.log("Door: Doorbell failed to ring.");
          interaction.editReply(
            "Uh Oh! Something went wrong.".concat(
              admin ? `Pinging ${admin.toString()} for help.` : ""
            )
          );
          reject(`Exited with code ${code}`);
        }
      });
    });
  },
};
