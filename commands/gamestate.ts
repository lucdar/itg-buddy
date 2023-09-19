import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command } from "../utils/Interfaces";
import { Gamestate } from "../gamestate";

const name = "gamestate";
const description = "Prints an embed with the current gamestate.";

export const gamestate: Command = {
  data: new SlashCommandBuilder().setName(name).setDescription(description),
  async execute(interaction: ChatInputCommandInteraction) {
    console.log("Gamestate: executing command");
    await interaction.reply({
      embeds: new Gamestate().embeds(),
    });
  },
};
