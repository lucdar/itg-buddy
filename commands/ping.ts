import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import { Command } from '../utils/Interfaces';
import axios from 'axios';

export const ping: Command = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Runs the ping command.'),
    async execute(interaction: CommandInteraction) {
        const response = await axios.get('http://localhost.com:9207/?command=ping');
        await interaction.reply(response.data);
    },
}