import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import { Command } from '../utils/Interfaces';
import { getLinkForCommand } from '../utils/helperFunctions';
import axios from 'axios';

export const ping: Command = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Runs the ping command.'),
    async execute(interaction: CommandInteraction) {
        try {
            const response = await axios.get(getLinkForCommand("ping"), { timeout: 2000 });
            await interaction.reply(`Pong! The itg-cli-server responded with: ${JSON.stringify(response.data)}`);
        } catch {
            await interaction.reply('There was an error while executing this command!');
        }
    },
}