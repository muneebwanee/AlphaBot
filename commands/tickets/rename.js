const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const { config, lang } = Utils.variables;

module.exports = {
    name: 'rename',
    run: async (bot, message, args) => {
        const ticket = await Utils.variables.db.get.getTickets(message.channel.id);
        const oldName = message.channel.name;
        const newName = args.join(" ");

        if (!ticket) return message.channel.send(Embed({ preset: 'error', description: lang.TicketModule.Errors.TicketNotExist }));
        if (!newName.length) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));
        
        await message.channel.setName(newName);

        message.channel.send(Embed({
            title: lang.TicketModule.Commands.Rename.Title,
            description: lang.TicketModule.Commands.Rename.Description.replace(/{old-name}/g, oldName).replace(/{new-name}/g, newName.toLowerCase())
        }));

        bot.emit("ticketRenamed", ticket, message.member, oldName, newName.toLowerCase());
    },
    description: "Rename a ticket channel",
    usage: 'rename <new name>',
    aliases: [
        'renameticket'
    ]
}
// 239232   ESOURCE__%%   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065