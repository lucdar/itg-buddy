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

enum QueueActions {
  JoinASAP = "join asap",
  JoinEndP1 = "join end p1",
  JoinEndP2 = "join end p2",
  Leave = "leave",
}

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
      if (i.customId === QueueActions.Leave) {
        globalQueue.removePlayer(i.user.username);
        await i.update({
          content: `${i.user} left the queue.`,
          embeds: [globalQueue.toEmbed()],
          components: [],
        });
        return;
      }
      if (i.customId === QueueActions.JoinASAP) {
        globalQueue.join(i.user.username);
      } else if (i.customId === QueueActions.JoinEndP1) {
        globalQueue.joinAt(i.user.username, globalQueue.length, "p1");
      } else if (i.customId === QueueActions.JoinEndP2) {
        globalQueue.joinAt(i.user.username, globalQueue.length, "p2");
      }
      await i.update({
        content: `${i.user} joined the queue!`,
        embeds: [globalQueue.toEmbed()],
        components: [],
      });
    });
  },
};

function getQueueEmbeds() {
  // Generate StringSelect options
  console.log("Queue: generating action row components");
  const components = [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(QueueActions.JoinASAP)
        .setLabel("Play ASAP")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(QueueActions.JoinEndP1)
        .setLabel("Join end (p1)")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(QueueActions.JoinEndP2)
        .setLabel("Join end (p2)")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(QueueActions.Leave)
        .setLabel("Leave")
        .setStyle(ButtonStyle.Danger)
    ),
    // new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    //   new StringSelectMenuBuilder()
    //     .setCustomId("select")
    //     .setPlaceholder("Play with someone else?")
    //     .addOptions(getQueueSelectOptions())
    // ),
  ];
  return components;
}

// function getQueueSelectOptions(): StringSelectMenuOptionBuilder[] {
//   const options = [];
//   for (let i = 0; i < globalQueue.length; i++) {
//     const option = new StringSelectMenuOptionBuilder()
//       .setLabel(`${i + 1}. ${globalQueue.get(i)}`)
//       .setValue(`${i + 1}`);
//     options.push(option);
//   }
//   return options;
// }
