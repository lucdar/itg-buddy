import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, InteractionUpdateOptions, ActionRow, ButtonComponent, InteractionButtonComponentData, ButtonInteraction, CollectorFilter, MessageComponentCollectorOptions, ComponentType, MessagePayload} from 'discord.js';
import { Command } from '../utils/Interfaces';
import { MessageOrInteraction } from '../utils/MessageOrInteraction';
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
        console.log("AddSong: executing command");
        await interaction.reply('Adding song...');

        const link = interaction.options.getString('link');
        if (link === null) {
            interaction.editReply('No link provided.');
            return;
        }
        
        addSongFromLink(new MessageOrInteraction(interaction), link);
    }
}

export async function addSongFromLink(interaction: MessageOrInteraction, link: string) {
    const cli = spawn('python3', ["../itg-cli/main.py", 'add-song', link]);
    cli.stdout.on('data', async (output: String) => {
        output = output.toString();
        // console.log('AddSong: received output from cli:', output);
        // Detect if the cli is prompting for input
        if (output.indexOf('Prompt') !== -1) {
            // Determine what the cli is prompting for
            if (output.indexOf('Overwrite cached download file?') !== -1) {
                // Overwrite the file by default.
                cli.stdin.write('O\n');
            } else if (output.indexOf('A folder with the same name already exists.') !== -1) {
                // Prompt the user to choose whether to overwrite the simfile or not
                // and input the response into the cli.
                promptSimfileOverwrite(interaction, cli);
            } else if (output.indexOf('Multiple valid simfiles found') !== -1) {
                // Exit the cli and send the user a message.
                interaction.editReply('Multiple valid simfiles found. Please only include one simfile at a time.');
                cli.kill();
            } else {
                console.log('AddSong: received unknown prompt from cli:', output);
                interaction.editReply('Error adding song.');
                cli.kill();
            }
        }
        // Detect a successful song addition
        if (output.indexOf('Song added successfully') !== -1) {
            interaction.editReply('Song added successfully. ```' + output + '```');
        }
    });
    // Detect errors
    cli.stderr.on('data', (error: String) => {
        console.log('AddSong: received error from cli:', error);
        interaction.editReply('Error adding song.');
    });
}

async function promptSimfileOverwrite(interaction: MessageOrInteraction, cli: ChildProcessWithoutNullStreams) {
    if (interaction.channel === null) {
        throw new Error('Interaction channel is null.');
    }
    interaction.editReply(MessagePayload.create(
        interaction.channel, 'A folder with the same name already exists.',{ 
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
            ]}
    ));
    
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
            if (interaction.channel === null) {
                throw new Error('Interaction channel is null.');
            }
            if (collected.size === 0) {
                interaction.editReply(MessagePayload.create(
                    interaction.channel, 'Timed out. Keeping existing simfile.',
                    { components: [] }
                ));
                cli.stdin.write('E\n');
            }
        });
    } catch (error) {
        console.log('AddSong: error creating collector:', error);
        interaction.editReply('Error adding song: ```' + error + '```');
    }
}
