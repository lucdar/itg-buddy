import {
  ChatInputCommandInteraction,
  Message,
  MessagePayload,
  TextBasedChannel,
  User,
} from "discord.js";

export class MessageOrInteraction {
  message: Message | null;
  interaction: ChatInputCommandInteraction | null;
  messageReply: Message | null;
  channel: TextBasedChannel | null;
  user: User;

  constructor(messageOrInteraction: Message | ChatInputCommandInteraction) {
    if (messageOrInteraction instanceof Message) {
      this.message = messageOrInteraction;
      this.interaction = null;
      this.user = this.message.author;
    } else if (messageOrInteraction instanceof ChatInputCommandInteraction) {
      this.message = null;
      this.interaction = messageOrInteraction;
      this.user = this.interaction.user;
    } else {
      throw new Error(
        "MessageOrInteraction: messageOrInteraction is not a Message or CommandInteraction."
      );
    }
    this.messageReply = null;
    this.channel = this.message?.channel ?? this.interaction?.channel ?? null;
  }

  reply(content: string | MessagePayload) {
    if (this.interaction) {
      return this.interaction.reply(content);
    } else if (this.message) {
      return this.message.reply(content).then((message) => {
        this.messageReply = message;
      });
    } else {
      throw new Error(
        "MessageOrInteraction: message and interaction are both null."
      );
    }
  }

  async editReply(content: string | MessagePayload): Promise<Message<boolean>> {
    // Split the message into multiple messages if it is too long.
    const messages: string[] = generateMessages(content);
    if (this.interaction) {
      // Messages is empty if content is a MessagePayload
      if (messages.length === 0 || messages.length === 1) {
        return this.interaction.editReply(content);
      } else {
        this.interaction.editReply(messages.shift() as string);
        while (messages.length > 1) {
          await this.interaction.followUp(messages.shift() as string);
        }
        return this.interaction.followUp(messages.shift() as string);
      }
    } else if (this.message && this.messageReply) {
      if (messages.length === 0 || messages.length === 1) {
        return this.messageReply.edit(content);
      } else {
        this.messageReply.edit(messages.shift() as string);
        while (messages.length > 1) {
          await this.messageReply
            .reply(messages.shift() as string)
            .then((message) => {
              this.messageReply = message;
            });
        }
        return this.messageReply
          .reply(messages.shift() as string)
          .then((message) => {
            this.messageReply = message;
            return message;
          });
      }
    }
    throw new Error("MessageOrInteraction: message and interaction are null.");
  }
}

function generateMessages(content: string | MessagePayload) {
  const messages: string[] = [];
  const maxSlice = 2000;
  if (typeof content === "string") {
    if (content.length > maxSlice) {
      while (content.length > maxSlice) {
        // Slice the content at newline boundaries when possible for cleaner messages.
        let sliceIndex = content.lastIndexOf("\n", maxSlice);
        if (sliceIndex === -1) {
          sliceIndex = maxSlice;
        }
        messages.push(content.slice(0, sliceIndex));
        content = content.slice(sliceIndex);
      }
    }
    messages.push(content);
  }
  return addMissingCodeDelimiters(messages);
}

function addMissingCodeDelimiters(messages: string[]) {
  if (messages.length <= 1) return messages;
  for (let i = 0; i < messages.length - 1; i++) {
    const delimiterCount = (messages[i].match(/```/g) || []).length;
    if (delimiterCount % 2 === 1) {
      messages[i] += "```";
      messages[i + 1] = "```" + messages[i + 1];
    }
  }
  return messages;
}
