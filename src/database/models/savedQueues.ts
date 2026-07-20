import sequelize from "../connection";
import { DataTypes, Model } from "sequelize";

class SavedQueue extends Model {
  declare guildId: string;
  declare name: string;
  declare songsJson: string;

  async getQueues(guildId: string) {
    let queueJson = await SavedQueue.findAll({
      where: {
        guildId: guildId,
      },
    });

    if (queueJson.length === 0) return null;
    return queueJson.map((queue) => {
      queue.songsJson = JSON.parse(queue.songsJson);
      return queue;
    });
  }

  async getQueue(guildId: string, name: string) {
    const queueJson = await SavedQueue.findOne({
      where: {
        guildId: guildId,
        queueName: name,
      },
    });

    if (queueJson) {
      return JSON.parse(queueJson.songsJson);
    }
    return null;
  }

  async saveQueue({
    guildId,
    name,
    songsJson,
  }: {
    guildId: string;
    name: string;
    songsJson: string;
  }) {
    return await SavedQueue.upsert({
      guildId: guildId,
      queueName: name,
      songsJson: songsJson,
    });
  }

  async deleteQueue({ guildId, name }: { guildId: string; name: string }) {
    return await SavedQueue.destroy({
      where: {
        guildId: guildId,
        queueName: name,
      },
    });
  }
}

SavedQueue.init(
  {
    guildId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    songsJson: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  { sequelize }
);

export default SavedQueue;
