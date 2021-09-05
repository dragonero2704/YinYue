
module.exports = {
  name: 'prefix',
  run(msg, args, bot, Discord){
    bot.prefix.delete(msg.guild.id)
    bot.prefix.set(msg.guild.id, args[1])
  } 
  
}