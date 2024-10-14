//includes

function toRawDuration(seconds) {
  let res = [];
  while (seconds > 0) {
    res.push(String(Math.floor(seconds % 60)).padStart(2, "0"));
    seconds /= 60;
    seconds = Math.floor(seconds);
  }
  return res.join(":");
}

class queuePages {
  #serverQueue;
  #pageIndex;
  #queueMsg;
  #queueCollector;
  constructor(serverQueue, msg) {
    this.#serverQueue = serverQueue;
    this.#pageIndex = 0;
    this.#queueMsg = msg;
    this.#queueCollector = undefined;
  }

  /**
   *
   * @returns the array of songs divided in chunks of 20 songs per chunk
   */
  queuePages() {
    let queue = [];
    const songs = this.#serverQueue.getSongs();
    songs.forEach((song, index) => {
      let line = "";
      if (index === this.currentIndex) {
        line = `    ⬐In riproduzione\n${index + 1}. ${
          song.title
        }\t${toRawDuration(
          song.duration - Math.round(this.getPlaybackDuration() / 1000)
        )} rimasti\n    ⬑In riproduzione`;
      } else {
        line = `${index + 1}. ${song.title}\t${song.durationRaw}`;
      }
      queue.push(line);
    });
    const songsxpage = 20;
    const pages = queue.reduce((resultArray, item, index) => {
      const chunkIndex = Math.floor(index / songsxpage);

      if (!resultArray[chunkIndex]) {
        resultArray[chunkIndex] = []; // start a new chunk
      }

      resultArray[chunkIndex].push(item);

      return resultArray;
    }, []);
    return pages;
  }

  startCollector(msg, buttonIds) {
    this.#pageIndex = 0;
    this.#queueMsg = msg;
    const filter = (inter) => {
      return buttonIds.includes(inter.customId);
    };

    let pages = this.queuePages();

    this.queueCollector = this.#queueMsg.createMessageComponentCollector({
      filter,
    });

    this.queueCollector.on("collect", (inter) => {
      if (!inter.message.editable) inter.message.fetch();
      inter.deferUpdate({
        fetchReply: false,
      });
      switch (inter.component.customId) {
        case buttonIds[0]:
          this.pageIndex = 0;
          break;
        case buttonIds[1]:
          this.pageIndex -= 1;
          if (this.pageIndex < 0) this.pageIndex = 0;
          break;

        case buttonIds[2]:
          this.pageIndex += 1;
          if (this.pageIndex >= pages.length) this.pageIndex = pages.length - 1;
          break;
        case buttonIds[3]:
          this.pageIndex = pages.length - 1;
          break;

        default:
          // console.log('default event')
          break;
      }

      let content = [ServerQueue.queueFormat.start];
      content = content.concat(pages[this.pageIndex]);
      content.push(ServerQueue.queueFormat.end);
      inter.message.edit(content.join("\n"));
    });
  }

  stopCollector() {
    if (this.queueCollector) {
      this.queueCollector.stop();
    }
    this.queueCollector = undefined;
    try {
      if (this ?? queueMsg ?? editable === false) {
        this.#queueMsg.fetch();
      }
      try {
        this.#queueMsg.delete();
      } catch (error) {
        //message is too old
      }
    } catch (error) {
      console.warn(error);
    }
    return;
  }

  async showQueue(interaction) {
    this.stopCollector();

    let pages = this.queuePages();

    let queue = [ServerQueue.queueFormat.start];
    queue = queue.concat(pages[0]);
    queue.push(ServerQueue.queueFormat.end);
    queue = queue.join("\n");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("FirstPage")
        .setLabel("<<")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("Previous")
        .setLabel("<")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("Next")
        .setLabel(">")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("LastPage")
        .setLabel(">>")
        .setStyle(ButtonStyle.Primary)
    );
    await interaction.reply(blank_field);
    await interaction.deleteReply();
    let queueinteraction = await interaction.channel.send({
      content: queue,
      components: [row],
    });
    // let queueinteraction = await interaction.reply({ content: queue, components: [row] });
    this.startCollector(queueinteraction, [
      "FirstPage",
      "Previous",
      "Next",
      "LastPage",
    ]);
  }
}

module.exports={
  queuePages
}
