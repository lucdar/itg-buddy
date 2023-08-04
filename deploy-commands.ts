/**
 * Script to deploy commands to a guild as configured in secrets.json.
 * Adapted from the discord.js.guide tutorial
 * @link https://discordjs.guide/creating-your-bot/command-deployment.html#guild-commands
 */

import { REST, Routes } from "discord.js";
import config from "./config";
import { Command } from "./utils/Interfaces";
import { getCommands } from "./utils/helperFunctions";

const commands = getCommands();
const commandsDataList = commands.map((command: Command) =>
  command.data.toJSON()
);

const rest = new REST().setToken(config.token);

(async () => {
  try {
    console.log(
      `Started refreshing ${commandsDataList.length} application (/) commands.`
    );

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commandsDataList }
    );

    if (data instanceof Array) {
      console.log(
        `Successfully reloaded ${data.length} application (/) commands:`
      );
      console.log(data.map((command: any) => command.name).join(", "));
    } else {
      console.error(`Failed to load commands. Response from Discord: ${data}`);
    }
  } catch (error) {
    console.error(error);
  }
})();
