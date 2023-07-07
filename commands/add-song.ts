import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, InteractionUpdateOptions, ActionRow, ButtonComponent, InteractionButtonComponentData, ButtonInteraction, CollectorFilter, MessageComponentCollectorOptions, ComponentType} from 'discord.js';
import { Command } from '../utils/Interfaces';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';

const name = 'add-song';
const description = 'Add a song from a specified link.';

export const addSong: Command = {
    data: new SlashCommandBuilder()
        .setName(name)
        .setDescription(description)
        .addStringOption(option => 
            option.setName('link')
                .setDescription('The link to the song to add.')),
    async execute(interaction: ChatInputCommandInteraction) {
        return new Promise(async (resolve, reject) => {
            console.log("AddSong: executing command");
            await interaction.reply('Adding song...');

            const link = interaction.options.getString('link');
            if (link === null) {
                interaction.editReply('No link provided.');
                reject('No link provided.');
                return;
            }

            const cli = spawn('python3', ["../itg-cli/main.py", 'add-song', link]);
            cli.stdout.on('data', async (output: String) => {
                output = output.toString();
                console.log('AddSong: received output from cli:', output);
                // Detect if the cli is prompting for input
                if (output.indexOf('Prompt') !== -1) {
                    // Determine what the cli is prompting for
                    if (output.indexOf('Overwrite cached download file?') !== -1) {
                        // Overwrite the file by default.
                        cli.stdin.write('O\n');
                    } else if (output.indexOf('A folder with the same name already exists.')) {
                        // Prompt the user to choose whether to overwrite the simfile or not
                        // and input the response into the cli.
                        promptSimfileOverwrite(interaction, cli);
                    }
                }
                // Detect a successful song addition
                if (output.indexOf('Song added successfully') !== -1) {
                    interaction.editReply('Song added successfully. ```' + output + '```');
                    resolve();
                }
            });
            // Detect errors
            cli.stderr.on('data', (error: String) => {
                console.log('AddSong: received error from cli:', error);
                interaction.editReply('Error adding song.');
                reject(error);
            })
        });
    }
}

async function promptSimfileOverwrite(interaction: ChatInputCommandInteraction, cli: ChildProcessWithoutNullStreams) {
    interaction.editReply({
        content: 'A folder with the same name already exists.',
        components: [
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents( 
                    new ButtonBuilder()
                        .setCustomId('overwrite')
                        .setLabel('Overwrite')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('existing')
                        .setLabel('Keep Existing')
                        .setStyle(ButtonStyle.Secondary),
                )
        ]
    });
    
    const filter = (i: ButtonInteraction) => {
        return i.user.id === interaction.user.id;
    };
    
    try {
        const channel = interaction.channel;
        if (!channel) {
            throw new Error('Interaction channel is null.');
        }
        const collector = channel.createMessageComponentCollector({
            filter,
            time: 15000,
            componentType: ComponentType.Button,
        });
    
        collector.on('collect', (interaction) => {
            if (interaction.customId === 'overwrite') {
                interaction.update({
                    content: 'Overwriting...',
                    components: []
                });
                cli.stdin.write('O\n');
            } else if (interaction.customId === 'existing') {
                interaction.update({
                    content: 'Keeping existing simfile.',
                    components: []
                });
                cli.stdin.write('E\n');
            }
        });
    
        collector.on('end', (collected) => {
            console.log('AddSong: collector ended.');
            if (collected.size === 0) {
                interaction.editReply({
                    content: 'Timed out. Keeping existing simfile.',
                    components: []
                });
                cli.stdin.write('E\n');
            }
        });
    } catch (error) {
        console.log('AddSong: error creating collector:', error);
        interaction.editReply('Error adding song: ```' + error + '```');
    }
}
