import sequelize from "../connection";
import { Model, DataTypes } from "sequelize";

class SlotLimit extends Model {
  declare guildId: string;
  declare slots: number;
  static defaultSlotLimit = 5;
  /**
   *
   * @param guildId guild id to search for
   * @returns slotLimit, if is not saved return defaultSlotLimit
   */
  async getLimit(guildId: string) {
    const limit = await SlotLimit.findOne({
      where: {
        guildId: guildId,
      },
    });
    return limit ? limit.slots : SlotLimit.defaultSlotLimit;
  }
}

SlotLimit.init(
  {
    guildId: {
      type: DataTypes.STRING,
    },
    slots: {
      type: DataTypes.INTEGER,
    },
  },
  { sequelize }
);

export default SlotLimit;
