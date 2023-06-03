import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import { Command } from '../utils/Interfaces';
import { getLinkForCommand, connectionErrorResponse } from '../utils/helperFunctions';
// import axios from 'axios';
import { io, Socket } from 'socket.io-client';

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
            console.log("Ping: executing command");
            const socket: Socket = io('http://localhost:9207');
            socket.on('connect_error', (err: Error) => {
                connectionErrorResponse(err, interaction);
            })
            interaction.reply('Pinging...');
            socket.on('connect', () => {
                console.log('Ping: connected to server');
                console.log('Ping: sending ping to server');
                socket.emit('ping', 1);
            });
            socket.on('pong', (data: number) => {
                console.log('Ping: received pong from server with data:', data);
                interaction.editReply(`Pong! Hit ${data} time${data == 1 ? '' : 's'}.`);
                if (data < 5) {
                    setTimeout(() => {
                        socket.emit('ping', data + 1);
                    }, 1000);
                } else {
                    console.log('Ping: disconnecting from server')
                    socket.disconnect(); // Do I have to do this explicitly?
                }
            });
        } catch {
            await interaction.reply('There was an error while executing this command!');
        }
    },
};
