import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import { Command } from '../utils/Interfaces';
import { getLinkForCommand } from '../utils/helperFunctions';
import axios from 'axios';

/**
 * Ping command to test connection from bot to itg-cli-server to itg-cli and back.
 */
const name = 'ping';
const description = 'Tests the connection from bot to cli.';

export const ping: Command = {
    data: new SlashCommandBuilder()
        .setName(name)
        .setDescription(description),
    async execute(interaction: CommandInteraction) {
        try {
            const response = await axios.get(getLinkForCommand('ping'), { timeout: 2000 });
            const formattedResponse = JSON.stringify(response.data, null, 4);
            await interaction.reply(
                `Pong! The itg-cli-server responded with: \`\`\`json\n${formattedResponse}\`\`\``
            );
        } catch {
            await interaction.reply('There was an error while executing this command!');
        }
    },
};
