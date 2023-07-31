import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Collection,
  ComponentType,
  MessagePayload,
} from "discord.js";
import { Command, instanceOfCommand } from "./Interfaces";
import { MessageOrInteraction } from "./MessageOrInteraction";
import { ChildProcessWithoutNullStreams } from "child_process";
const fs = require("node:fs");
const path = require("node:path");

/**
 * Formats comment and code into a string with code block.
 * @param comment the comment to be formatted
 * @param code the code to be formatted
 * @example formatComment("This is a comment.", "python")
 * returns "This is a comment.```python```"
 */
export function codeFormat(comment: string, code: string): string {
  return comment + "```" + code + "```";
}

/**
 * Returns a collection of commands based on the files in the commands directory
 * where the key is the command name and the value is the command object.
 * Adapted from the discord.js.guide tutorial
 * @link https://discordjs.guide/creating-your-bot/command-handling.html#loading-command-files
 */
export function getCommands(): Collection<string, Command> {
  const commands = new Collection<string, Command>();
  const commandsPath: string = path.resolve(__dirname, "..", "commands");
  const commandFiles: string[] = fs
    .readdirSync(commandsPath)
    .filter((file: string) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const exportedObject: any = require(filePath);
    const maybeCommand: any = Object.values(exportedObject)[0];
    // check if maybeCommand is a Command object, throw an error if the file is not a command
    if (instanceOfCommand(maybeCommand) === false) {
      throw new Error(`Command file ${file} does not export a Command object.`);
    }
    const command: Command = maybeCommand;
    commands.set(command.data.name, command);
  }
  if (commands.size === 0) {
    throw new Error("No commands were found.");
  }
  return commands;
}

/**
 * Prompts the user to choose whether to overwrite a pack/simfile or not.
 * @param interaction the interaction that triggered the command
 * @param cli the child process that is running the itg-cli command
 * @param type "pack" | "simfile" - the type of file that is being overwritten
 */
export async function promptOverwrite(
  interaction: MessageOrInteraction,
  cli: ChildProcessWithoutNullStreams,
  type: string
) {
  if (interaction.channel === null) {
    throw new Error("Interaction channel is null.");
  }
  interaction.editReply(
    MessagePayload.create(
      interaction.channel,
      `A ${type} with the same name already exists.`,
      {
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId("overwrite")
              .setLabel("Overwrite")
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId("existing")
              .setLabel("Keep Existing")
              .setStyle(ButtonStyle.Secondary)
          ),
        ],
      }
    )
  );

  const filter = (i: ButtonInteraction) => {
    return i.user.id === interaction.user.id;
  };

  try {
    const channel = interaction.channel;
    if (!channel) {
      throw new Error("Interaction channel is null.");
    }
    const collector = channel.createMessageComponentCollector({
      filter,
      time: 15000,
      componentType: ComponentType.Button,
    });

    collector.on("collect", (interaction) => {
      if (interaction.customId === "overwrite") {
        interaction
          .update({
            content: `Overwriting ${type}...`,
            components: [],
          })
          .then(() => {
            cli.stdin.write("O\n");
          });
      } else if (interaction.customId === "existing") {
        interaction
          .update({
            content: `Keeping existing ${type}.`,
            components: [],
          })
          .then(() => {
            cli.stdin.write("E\n");
          });
      }
    });

    collector.on("end", (collected) => {
      if (interaction.channel === null) {
        throw new Error("Interaction channel is null.");
      }
      if (collected.size === 0) {
        interaction.editReply(
          MessagePayload.create(
            interaction.channel,
            `Timed out. Keeping existing ${type}.`,
            { components: [] }
          )
        );
        cli.stdin.write("E\n");
      }
    });
  } catch (error: any) {
    console.log("AddSong: error creating collector:", error);
    interaction.editReply(codeFormat("Error adding song:", error.toString()));
  }
}

/**
 * Closure that returns a function to handle stderr output from the itg-cli command.
 * @returns a function that handles stderr output from the itg-cli command.
 * @param output the output from the itg-cli command
 * @param interaction the interaction that triggered the command
 * @param command the command that is being executed
 */
export function createErrorHandler() {
  let replyLock = false;

  return async (
    output: string | Buffer | Error,
    interaction: MessageOrInteraction,
    command: "AddSong" | "AddPack"
  ) => {
    if (output.toString().match(/\d+%/)) {
      if (replyLock) {
        return;
      }
      replyLock = true;
      setTimeout(() => {
        replyLock = false;
      }, 300);
      interaction.editReply(codeFormat("Downloading...", output.toString()));
    } else if (output.toString().indexOf("To:") === 0) {
      return; // Output by gdown. Ignore.
    } else {
      console.error(`${command}: stderr: ${output.toString()}`);
      interaction.editReply(
        codeFormat("An error occurred.", output.toString())
      );
    }
  };
}
