const fs = require('node:fs');
const path = require('node:path');
import { Client, Collection, Events, GatewayIntentBits, ChatInputCommandInteraction} from 'discord.js';
import { token } from './secrets.json';
import { Command } from './utils/Interfaces';
import { getCommands } from './utils/helperFunctions';
// import { io } from 'socket.io-client';

class CommandClient extends Client {
    commands: Collection<string, Command>;
    constructor() {
        super({ intents: [GatewayIntentBits.Guilds] });
        this.commands = getCommands();
    }
}
const client = new CommandClient();

// CommandLock prevents the same command from being executed multiple times in parallel.
const commandLock = new Set();
async function executeCommand(command: Command, interaction: ChatInputCommandInteraction) {
	try {
		await command.execute(interaction).then(() => {
			commandLock.delete(command.data.name);
		});
	} catch (error) {
		console.error(error);
		const errorReply = 'There was an error while executing this command!'
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: errorReply, ephemeral: true });
		} else {
			await interaction.reply({ content: errorReply, ephemeral: true });
		}
		commandLock.delete(command.data.name);
	}
}

// Execute the commands when they are called.
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}
	if (commandLock.has(command.data.name)) {
		console.log(`Command ${command.data.name} is already running.`);
		interaction.reply({ content: 'This command is already running. Please wait and try again.', ephemeral: true });
	} else {
		commandLock.add(command.data.name);
		executeCommand(command, interaction);
	}
});

// Log in to the client.
client.once(Events.ClientReady, c => {
    console.log('Ready! Logged in as ' + c.user?.tag);
});

client.login(token);