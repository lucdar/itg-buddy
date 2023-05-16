import { CommandInteraction, SlashCommandBuilder } from 'discord.js';

export interface Command {
    data: SlashCommandBuilder;
    execute: (interaction: CommandInteraction) => Promise<void>;
}

export function instanceOfCommand(object: any): object is Command {
    return 'data' in object && 'execute' in object;
}
