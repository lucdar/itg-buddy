const fs = require('node:fs');
const path = require('node:path');
import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import { token } from './secrets.json';
import { Command } from './utils/Interfaces';
import { getCommands } from './utils/helperFunctions';
import { ChatInputCommandInteraction } from 'discord.js';

class CommandClient extends Client {
    commands: Collection<string, Command>;
    constructor() {
        super({ intents: [GatewayIntentBits.Guilds] });
        this.commands = getCommands();
    }
}
const client = new CommandClient();

// Execute the commands when they are called.
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;
	console.log(interaction);

    const command = client.commands.get(interaction.commandName);
    if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

    try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

// Log in to the client.
client.once(Events.ClientReady, c => {
    console.log('Ready! Logged in as ' + c.user?.tag);
});

client.login(token);