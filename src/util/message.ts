import {Message, EmojiIdentifierResolvable} from "discord.js"

interface MessageReplyParams {
  message: Message;
  content: string;
  timeout: number;
}

interface MessageReactParams {
  message: Message;
  reaction: EmojiIdentifierResolvable;
}

export function reply({ message, content, timeout }: MessageReplyParams) {
  if (!timeout) message.reply({ content }).catch(/*error handling*/);
  else
    message.reply({ content }).then((msg) => {
      setTimeout(() => {
        if (msg.editable) msg.delete();
      }, timeout);
    });
}

export function react({ message, reaction }: MessageReactParams) {
  message.react(reaction).catch(/** error handling */);
}