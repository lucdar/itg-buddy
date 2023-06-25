import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../utils/Interfaces';
import { connectionErrorResponse } from '../utils/helperFunctions';
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
    async execute(interaction: ChatInputCommandInteraction) {
        return new Promise(async (resolve, reject) => {
            console.log("Ping: executing command");
            await interaction.reply('Pinging...');
            const socket: Socket = io('http://localhost:9207');
            socket.on('connect_error', (err: Error) => {
                connectionErrorResponse(err, interaction);
            })
            socket.on('connect', () => {
                console.log('Ping: connected to server');
                console.log('Ping: sending ping to server');
                socket.emit('ping', {
                    source: 'client',
                    action: 'ping',
                    status: 0,
                    numHits: 0
                });
            });
            socket.on('ping', async (args) => {
                console.log('Ping: received ping from server with args:', args);
                if (args.source === 'client') { // Ignore pings from this client.
                    return;
                }
                if (args.status !== 0) {
                    console.log('Ping: command failed with the following message: ', args.message);
                    console.log('Ping: disconnecting from server')
                    socket.disconnect() // Do I have to call this explicitly?
                    reject(args.message);
                    return;
                }
                console.log('Ping: received pong from server with numHits:', args.numHits);
                const s = args.numHits == 1 ? '' : 's';
                const message = `Pong! Hit ${args.numHits} time${s}.`;
                await interaction.editReply(message);
                if (args.numHits < 5) {
                    setTimeout(() => {
                        socket.emit('ping', {
                            source: 'client',
                            status: 0,
                            numHits: args.numHits
                        });
                    }, 1000);
                } else {
                    console.log('Ping: command finished successfully.')
                    console.log('Ping: disconnecting from server')
                    interaction.editReply('Ping command finished successfully.');
                    socket.disconnect(); // Do I have to do this explicitly?
                    resolve();
                }
            });
        });
    },
};
