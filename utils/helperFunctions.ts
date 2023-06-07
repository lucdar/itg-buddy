import { Collection, CommandInteraction } from 'discord.js';
import { Command, instanceOfCommand } from './Interfaces';
const fs = require('node:fs');
const path = require('node:path');

/**
 * Returns a collection of commands based on the files in the commands directory
 * where the key is the command name and the value is the command object.
 * Adapted from the discord.js.guide tutorial
 * @link https://discordjs.guide/creating-your-bot/command-handling.html#loading-command-files
 */
export function getCommands(): Collection<string, Command> {
    const commands = new Collection<string, Command>();
    const commandsPath: string = path.resolve(__dirname, '..', 'commands');
    const commandFiles: string[] = fs.readdirSync(commandsPath).filter((file: string) => file.endsWith('.js'));
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
        throw new Error('No commands were found.');
    }
    return commands;
}

export async function connectionErrorResponse(error: Error, interaction: CommandInteraction) {
    console.log(error);    
    const message = 'There was an error while connecting to the itg-cli-server.\n```' + error + '```';
    if (interaction.replied || interaction.deferred) {
        await interaction.followUp(message);
    } else {
        await interaction.reply(message);
    }
}
