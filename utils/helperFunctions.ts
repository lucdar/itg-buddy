import { Collection } from 'discord.js';
import { Command, instanceOfCommand } from './Interfaces';
import { API_URL } from '../secrets.json';
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

/**
 * Returns the link to make a request for a supplied command.
 * Abstraction to make it easier to change API_URL and route structure in the future.
 */
export function getLinkForCommand(command: string): string {
    return `${API_URL}?command=${command}`;
}
