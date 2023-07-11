import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command } from "../utils/Interfaces";
import { spawn } from "child_process";
import { codeFormat, promptOverwrite } from "../utils/helperFunctions";
import { MessageOrInteraction } from "../utils/MessageOrInteraction";

const name = "add-pack";
const description = "Adds a simfile pack from the specified link.";

export const addPack: Command = {
  data: new SlashCommandBuilder()
    .setName(name)
    .setDescription(description)
    .addStringOption((option) =>
      option
        .setName("link")
        .setDescription("The link to the pack to add.")
        .setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    console.log("AddPack: executing command");
    await interaction.reply("Adding pack...");

    const link = interaction.options.getString("link");
    if (link === null) {
      interaction.editReply("No link provided.");
      return;
    }

    addPackFromLink(new MessageOrInteraction(interaction), link);
  },
};

function addPackFromLink(interaction: MessageOrInteraction, link: string) {
  if (!link.startsWith("http")) {
    interaction.editReply("Invalid link.");
    return;
  }
  const cli = spawn("python3", ["../itg-cli/main.py", "add-pack", link]);
  let packMetadata: string = "";
  cli.stdout.on("data", (data) => {
    const output: String = data.toString();
    console.log(`AddPack: stdout: ${output}`);
    if (output.includes("Prompt: ")) {
      if (output.includes("Overwrite cached download file?")) {
        cli.stdin.write("O\n"); // Overwrite cached file by default
      } else if (output.includes("Do you want to add these courses?")) {
        cli.stdin.write("Y\n"); // Add courses by default
      } else if (output.includes("Pack already exists")) {
        // Prompt the user to overwrite the pack
        promptOverwrite(interaction, cli, "pack");
      }
    }
    if (output.includes("Pack metadata:")) {
      // TODO: For some reason this isn't setting the packMetadata variable. Why?
      packMetadata = output.split("Pack metadata:")[1].split("Prompt:")[0];
      cli.stdin.write("Y\n"); // Add pack by default
    }
    if (output.includes("successfully")) {
      interaction.editReply(codeFormat(output.toString(), packMetadata));
    }
  });

  cli.stderr.on("data", (output) => {
    console.error("AddPack: stderr:" + output);
    // TODO: for some reason the Google Drive API writes download updates to this stream
    // and it causes the bot to run up against the Discord API rate limit.
    // Need to figure out how to mitigate this. (Only provide updates every once in a while?)
    // Would be nice to have these download progress updates though!

    // interaction.editReply(
    //   codeFormat("An error occurred while adding the pack.", output.toString())
    // );
  });
  cli.on("close", (code) => {
    console.log(`AddPack: child process exited with code ${code}`);
    if (code !== 0) {
      interaction.editReply("An error occurred while adding the pack.");
    }
  });
}
