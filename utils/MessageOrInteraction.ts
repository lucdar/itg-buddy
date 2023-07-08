import { ChatInputCommandInteraction, Message, MessagePayload, TextBasedChannel, User } from "discord.js";

export class MessageOrInteraction {
    message: Message | null;
    interaction: ChatInputCommandInteraction | null;
    messageReply: Message | null;
    channel: TextBasedChannel | null;
    user: User;

    constructor( messageOrInteraction: Message | ChatInputCommandInteraction ) {
        if (messageOrInteraction instanceof Message) {
            this.message = messageOrInteraction;
            this.interaction = null;
            this.user = this.message.author;
        } else if (messageOrInteraction instanceof ChatInputCommandInteraction) {
            this.message = null;
            this.interaction = messageOrInteraction;
            this.user = this.interaction.user;
        } else {
            throw new Error('MessageOrInteraction: messageOrInteraction is not a Message or CommandInteraction.');
        }
        this.messageReply = null;
        this.channel = messageOrInteraction.channel;
    }

    reply(content: string | MessagePayload) {
        if (this.interaction) {
            return this.interaction.reply(content);
        } else if (this.message) {
            return this.message.reply(content).then(message => {
                this.messageReply = message;
            });
        } else {
            throw new Error('MessageOrInteraction: message and interaction are both null.');
        }
    }

    editReply(content: string | MessagePayload): Promise<Message<boolean>> {
        if (this.interaction) {
            return this.interaction.editReply(content);
        } else {
            if (!this.messageReply) {
                throw new Error('MessageOrInteraction: messageReply is null.');
            }
            return this.messageReply.edit(content);
        }
    }
}