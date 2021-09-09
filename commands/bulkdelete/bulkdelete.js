
module.exports = {
  name: 'bulkdelete',
  aliases: ['clean'],
  run: (msg, args, bot, Discord) =>{
    try{
      msg.channel.bulkDelete(parseInt(args[1]))
    }catch(error){
      console.log(error)
    } 
  }
}