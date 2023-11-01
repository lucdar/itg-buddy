import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  ActivityType,
  ActivitiesOptions,
  PresenceStatusData,
} from "discord.js";
import config from "./config";
import { Command } from "./utils/Interfaces";
import { getCommands, codeFormat } from "./utils/helperFunctions";
import { watchGamestate, Gamestate } from "./gamestate";

// Create a new client.
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
  } catch (error: any) {
    const errorReply = codeFormat(
      "There was an error while executing this command!",
      error.toString()
    );
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
  // console.log("Message sent!");
  if (message.channel.id !== config.addSongChannel) return;
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
  await moi.reply("Adding song...");
  addSongFromLink(moi, link);
});

// Log in to the client.
client.once(Events.ClientReady, (c) => {
  console.log("Ready! Logged in as " + c.user?.tag);
});

client.login(config.token);

if (config.saveFolder === null) {
  console.error(
    "No save folder specified in config.json. Not watching gamestate."
  );
} else {
  console.log("Watching gamestate...");
  watchGamestate((gamestate: Gamestate) => {
    // Update bot's status and activity based on the gamestate.
    let status: PresenceStatusData;
    let activity: ActivitiesOptions;

    switch (gamestate.currentScreen) {
      case "ScreenGameplay": {
        // Gameplay Screen
        status = "online";
        activity = {
          name: `${gamestate.songInfo?.title}`,
          type: ActivityType.Playing,
        };
        break;
      }
      case "ScreenEvaluationStage": {
        // Score Screen
        status = "online";
        activity = {
          name: `${gamestate.songInfo?.title} (Score Screen)`,
          type: ActivityType.Playing,
        };
        break;
      }
      case "ScreenSelectMusic": {
        // Song Select Screen
        status = "online";
        activity = {
          name: "Song Select",
          type: ActivityType.Playing,
        };
        break;
      }
      default: {
        status = "idle";
        activity = {
          name: "Waiting on next players...",
          type: ActivityType.Playing,
        };
        break;
      }
    }

    if (!client.user) {
      console.error("No client user found!");
      return;
    }
    client.user.setStatus(status);
    console.log("Setting Presence: " + activity.name);
    client.user.setActivity(activity);
  });
}
