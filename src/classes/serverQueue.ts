// imports
import { Song } from "../interfaces";
import {
  InternalDiscordGatewayAdapterCreator,
  Locale,
  TextChannel,
  VoiceChannel,
} from "discord.js";

import {
  entersState,
  joinVoiceChannel,
  VoiceConnection,
  VoiceConnectionStatus,
  AudioPlayer
} from "@discordjs/voice";

import {} from "../play_dl";

interface ServerQueueParameters {
  song: Song;
  textChanel: TextChannel;
  voiceChannelId: string;
  adapterCreator: InternalDiscordGatewayAdapterCreator;
  guildId: string;
  autodie: boolean;
  autodieDelay: number;
  locale: Locale;
}

class ServerQueue {
  /**
   * Properties
   */
  #songsArray: Array<Song>;
  #voiceChannelId: string;
  #connection: VoiceConnection;
  #autodie: boolean;
  #autodieDelay: number;
  #textChanel: TextChannel;
  locale: Locale;

  static Messages: any;

  /**
   * Methods
   */
  constructor({
    song,
    textChanel,
    voiceChannelId,
    adapterCreator,
    guildId,
    autodie = true,
    autodieDelay = 60_000,
    locale = Locale.EnglishGB,
  }: ServerQueueParameters) {
    // save parameters
    this.#songsArray = Array.isArray(song) ? song.flat() : [song];
    this.#textChanel = textChanel;
    this.#voiceChannelId = voiceChannelId;
    this.#autodie = autodie;
    this.#autodieDelay = autodieDelay;
    this.locale = locale;

    this.#connection = joinVoiceChannel({
      channelId: this.#voiceChannelId,
      guildId,
      adapterCreator,
    });

    this.#connection.on(
      VoiceConnectionStatus.Disconnected,
      async (oldState, newState) => {
        try {
          Promise.race([
            entersState(
              this.#connection,
              VoiceConnectionStatus.Connecting,
              5_000
            ),
            entersState(
              this.#connection,
              VoiceConnectionStatus.Signalling,
              5_000
            ),
          ]);
        } catch (error) {
          // real disconnect, delete queue
          this.delete();
        }
      }
    );
  }

  delete(){
    // close connection
    this.#connection.disconnect();
    this.#connection.destroy();

    // delete songs

  }

  getJoinConfig() {
    return this.#connection?.joinConfig ?? null;
  }

}
