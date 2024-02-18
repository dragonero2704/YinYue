const { SlashCommandBuilder } = require("discord.js");
const { Prefixes } = require("../../database/models/prefixes");

function fieldEmbed(guild, title, content) {
  let embed = require("../../misc/embed")(guild);
  embed.addFields([{ name: title, value: content }]);
  // embed.setDescription('')
  return embed;
}

function titleEmbed(guild, title) {
  let embed = require("../../misc/embed")(guild);
  embed.setTitle(title);
  // embed.setDescription('')
  return embed;
}

module.exports = {
  name: "prefix",
  description: "changes bot prefix!",
  // disabled: true,
  data: new SlashCommandBuilder()
    .setName("prefix")
    .setDescription("Changes prefix")
    .addStringOption((input) =>
      input.setName("prefix").setDescription("The new prefix").setMaxLength(1)
    ),
  async run(msg, args, bot) {
    // if (this.disabled)
    //     return msg.guild.send('comando disabilito, coming soon!')
    let id = msg.guild.id;
    // console.log(args.join('|'))
    let prefix = args[1];
    let curPrefix = await Prefixes.findOne({ where: { serverId: id } });
    if (!prefix) {
      if (!curPrefix)
        return msg.reply({
          embeds: [titleEmbed(msg.guild, `[ Prefix ] : [ - ]`)],
        });
      return msg.reply({
        embeds: [titleEmbed(msg.guild, `[ Prefix ] : [ ${curPrefix.prefix} ]`)],
      });
    }
    prefix = prefix.substring(0, 1);
    if (!curPrefix) {
      console.log(`Changing prefix for ${id}:'${prefix}'`);
      Prefixes.create({
        serverId: id,
        prefix: prefix,
      });
    } else {
      console.log(`Changing prefix for ${id}:'${curPrefix}'=>'${prefix}'`);
      await Prefixes.update({ prefix: prefix }, { where: { serverId: id } });
    }
  },
  async execute(interaction, bot, locale, ...params) {
    let id = interaction.guild.id;
    // console.log(args.join('|'))
    let prefix = interaction.options.getString("prefix");
    let curPrefix = await Prefixes.findOne({ where: { serverId: id } });
    if (!prefix) {
      if (!curPrefix)
        return interaction.reply({
          embeds: [titleEmbed(interaction.guild, `[ Prefix ] : [ - ]`)],
        });
      return interaction.reply({
        embeds: [
          titleEmbed(interaction.guild, `[ Prefix ] : [ ${curPrefix.prefix} ]`),
        ],
      });
    }
    prefix = prefix.substring(0, 1);
    if (!curPrefix) {
      console.log(`Changing prefix for ${id}:'${prefix}'`);
      Prefixes.create({
        serverId: id,
        prefix: prefix,
      });
    } else {
      console.log(`Changing prefix for ${id}:'${curPrefix}'=>'${prefix}'`);
      await Prefixes.update({ prefix: prefix }, { where: { serverId: id } });
    }
  },
};
