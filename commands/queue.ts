import {
  ActionRow,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../utils/Interfaces";
import { globalQueue } from "../utils/ITGQueue";

const name = "queue";
const description = "Prints an embed with the current queue.";

export const queue: Command = {
  data: new SlashCommandBuilder().setName(name).setDescription(description),
  async execute(interaction) {
    console.log("Queue: executing command");
    if (!interaction.channel) {
      console.error("Interaction channel is null.");
    }
    console.log("Queue: sending embed");
    await interaction.reply({
      content: "Here's the current queue:",
      embeds: [globalQueue.toEmbed()],
      components: getQueueEmbeds(),
    });

    const filter = (i: any) => {
      return i.user.id === interaction.user.id;
    };
    const buttonCollector =
      interaction.channel?.createMessageComponentCollector({
        filter,
        time: 15000,
        componentType: ComponentType.Button,
      });
    buttonCollector?.on("collect", async (i) => {
      if (i.customId === "join") {
        console.log(
          "Queue: join button triggered. Adding player to queue:",
          i.user.username
        );
        globalQueue.join(i.user.username);
        await i.update({
          content: `${i.user} joined the queue!`,
          embeds: [globalQueue.toEmbed()],
          components: [],
        });
      }
    });
  },
};

function getQueueEmbeds() {
  // Generate StringSelect options
  console.log("Queue: generating action row components");
  const components = [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("join")
        .setLabel("Play ASAP")
        .setStyle(ButtonStyle.Primary)
    ),
  ];
  return components;
}
