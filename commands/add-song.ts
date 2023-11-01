import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessagePayload,
} from "discord.js";
import { Command } from "../utils/Interfaces";
import { MessageOrInteraction } from "../utils/MessageOrInteraction";
import { spawn } from "child_process";
import {
  codeFormat,
  createErrorHandler,
  promptOverwrite,
} from "../utils/helperFunctions";

const name = "add-song";
const description = "Add a song from a specified link.";

export const addSong: Command = {
  data: new SlashCommandBuilder()
    .setName(name)
    .setDescription(description)
    .addStringOption((option) =>
      option.setName("link").setDescription("The link to the song to add.")
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    console.log("AddSong: executing command");
    await interaction.reply("Adding song...");

    const link = interaction.options.getString("link");
    if (link === null) {
      interaction.editReply("No link provided.");
      return;
    }

    addSongFromLink(new MessageOrInteraction(interaction), link);
  },
};

export async function addSongFromLink(
  interaction: MessageOrInteraction,
  link: string
) {
  if (!link.startsWith("http")) {
    interaction.editReply("Invalid link.");
    return;
  }
  const errorHandler = createErrorHandler();
  const cli = spawn("python3", ["../itg-cli/main.py", "add-song", link]);
  cli.stdout.on("data", async (output: String) => {
    output = output.toString();
    // console.log('AddSong: received output from cli:', output);
    // Detect if the cli is prompting for input
    if (output.includes("Prompt")) {
      // Determine what the cli is prompting for
      if (output.includes("Overwrite cached download file?")) {
        // Overwrite the file by default.
        cli.stdin.write("O\n");
      } else if (
        output.includes("A folder with the same name already exists.")
      ) {
        // Prompt the user to choose whether to overwrite the simfile or not
        // and input the response into the cli.
        promptOverwrite(interaction, cli, "simfile");
      } else if (output.includes("Multiple valid simfiles found")) {
        // Exit the cli and send the user a message.
        interaction.editReply(
          "Multiple valid simfiles found. Please only include one simfile at a time."
        );
        cli.kill();
      } else {
        console.log("AddSong: received unknown prompt from cli:", output);
        interaction.editReply("Error adding song.");
        cli.kill();
      }
    }
    // Detect a successful song addition
    if (output.includes("Song added successfully")) {
      const songInfo = output.split("### Song added successfully ###")[1];
      const embed = new EmbedBuilder()
        .setTitle("Song added successfully")
        .setDescription(codeFormat("", songInfo))
        .setColor("#53d5fd")
        .setFooter({
          text: `added by ${interaction.user.tag}`,
        });
      if (interaction.channel == null) {
        throw new Error("Interaction channel is null.");
      }
      interaction.reply(
        MessagePayload.create(interaction.channel, {
          embeds: [embed],
        })
      );
    }
  });
  cli.stderr.on("data", (output) => {
    errorHandler(output, interaction, "AddSong");
  });
}
