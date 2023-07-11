import { Client, Collection, Events, GatewayIntentBits } from "discord.js";
import { token, addSongChannel } from "./secrets.json";
import { Command } from "./utils/Interfaces";
import { getCommands } from "./utils/helperFunctions";
// import { io } from 'socket.io-client';

class CommandClient extends Client {
  commands: Collection<string, Command>;
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });
    this.commands = getCommands();
  }
}
const client = new CommandClient();

// Execute the commands when they are called.
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }
  try {
    await command.execute(interaction);
  } catch (error) {
    const errorReply =
      "There was an error while executing this command! ```" + error + "```";
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: errorReply,
        ephemeral: true,
      });
    } else {
      await interaction.reply({ content: errorReply, ephemeral: true });
    }
  }
});

// Execute add-song when a file is uploaded to the add-song channel.
import { addSongFromLink } from "./commands/add-song";
import { MessageOrInteraction } from "./utils/MessageOrInteraction";

client.on(Events.MessageCreate, async (message) => {
  if (message.channel.id !== addSongChannel) return;
  if (message.author.bot) return;
  const attachment = message.attachments.first();
  if (!attachment) return;
  if (attachment.contentType !== "application/zip") {
    message.reply("File must be a .zip file.");
    return;
  }
  const link = attachment.url;
  if (!link) return;
  const moi = new MessageOrInteraction(message);
  moi.reply("Adding song...");
  addSongFromLink(moi, link);
});

// Log in to the client.
client.once(Events.ClientReady, (c) => {
  console.log("Ready! Logged in as " + c.user?.tag);
});

client.login(token);
