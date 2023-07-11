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
    this.channel = messageOrInteraction.channel;
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
      if (messages.length === 0) {
        return this.interaction.editReply(content);
      } else {
        this.interaction.editReply(messages.pop() as string);
        while (messages.length > 1) {
          this.interaction.followUp(messages.pop() as string);
        }
        return this.interaction.followUp(messages.pop() as string);
      }
    } else if (this.message && this.messageReply) {
      if (messages.length === 0) {
        return this.messageReply.edit(content);
      } else {
        this.messageReply.edit(messages.pop() as string);
        while (messages.length > 1) {
          await this.messageReply
            .reply(messages.pop() as string)
            .then((message) => {
              this.messageReply = message;
            });
        }
        return this.messageReply
          .reply(messages.pop() as string)
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
  if (typeof content === "string") {
    if (content.length > 2000) {
      while (content.length > 2000) {
        // Slice the content at newline boundaries when possible for cleaner messages.
        let sliceIndex = content.lastIndexOf("\n", 2000);
        if (sliceIndex === -1) {
          sliceIndex = 2000;
        }
        messages.push(content.slice(0, sliceIndex));
        content = content.slice(2000);
      }
    }
    messages.push(content);
  }
  return messages;
}
