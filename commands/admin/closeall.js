const Utils = require("../../modules/utils.js")
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: 'closeall',
    run: async (bot, message, args) => {

        async function closeAllTickets() {
            let channels = await Utils.getOpenTickets(message.guild);

            channels.forEach(async ch => {
                const ticket = await Utils.variables.db.get.getTickets(ch.id);
                if (!ticket) return ch.send(Embed({ preset: 'error', description: lang.TicketModule.Errors.TicketNotExist }));

                ch.delete();
                require('../../modules/transcript.js')(ch.id);

                bot.emit("ticketClosed", ticket, message.member, undefined);
            })

            await message.channel.send(Embed({ title: lang.TicketModule.Commands.Closeall.Complete, color: config.Success_Color }));
        }

        if (config.Tickets.Logs.Enabled) {
            let channel = Utils.findChannel(config.Tickets.Logs.Channel, message.guild)
            if (!channel) return message.channel.send(Embed({ preset: 'console' }));
        }

        if (config.Tickets.CloseAllConfirmation) {
            let msg = await message.channel.send(Embed({ title: lang.TicketModule.Commands.Closeall.Confirmation }));
            await msg.react('✅');
            await msg.react('❌');
            Utils.waitForReaction(['✅', '❌'], message.author.id, msg).then(reaction => {
                msg.delete();
                return (reaction.emoji.name == '✅') ? closeAllTickets() : message.channel.send(Embed({ title: lang.TicketModule.Commands.Closeall.Canceled }));
            })
        } else {
            closeAllTickets();
        }
    },
    description: "Close all open tickets",
    usage: 'closeall',
    aliases: []
}

// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065