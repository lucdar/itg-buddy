const fs = require('node:fs');
const path = require('node:path');
import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import { token } from './secrets.json';
import { Command } from './utils/Interfaces';
import { ChatInputCommandInteraction } from 'discord.js';

class CommandClient extends Client {
    commands: Collection<string, Command>;
    constructor() {
        super({ intents: [GatewayIntentBits.Guilds] });
        this.commands = new Collection();
    }
}
const client = new CommandClient();

// Read all files in the commands directory and add them to the client.commands collection.
// From the discord.js.guide tutorial, unsure if this is the best way to do this. Reading files is kind of jank tbh.
// Weird how the fs functions are any type output. Maybe I have a configuration set up wrong?
const commandsPath: string = path.join(__dirname, 'commands');
const commandFiles: string[] = fs.readdirSync(commandsPath).filter((file: string) => file.endsWith('.js'));
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command: Command = require(filePath);
    client.commands.set(command.data.name, command);
}

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