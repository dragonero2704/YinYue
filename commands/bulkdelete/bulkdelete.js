
module.exports = {
  name: 'bulkdelete',
  aliases: ['clean'],
  run: (msg, args, bot, Discord) =>{
    msg.channel.bulkDelete(parseInt(args[1]))
  }
}