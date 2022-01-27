const Discord = require("discord.js");
const Utils = require("../utils.js");
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = async (bot, args, member, channel, closeConfirmation = config.Tickets.CloseConfirmation) => {
    return new Promise(async resolve => {
        const ticket = await Utils.variables.db.get.getTickets(channel.id);
        // The ticket doesn't exist, check to see if it is an application
        if (!ticket) {
            const application = await Utils.variables.db.get.getApplications(channel.id)
            if (!application) {
                return channel.send(Embed({ preset: 'error', description: lang.TicketModule.Errors.TicketNotExist }));
            } else {
                channel.delete();
                require('../../modules/transcript.js')(channel.id, false);

                bot.emit("applicationClosed", application, member, args.length > 0 ? args.join(" ") : undefined);

                return;
            }
        }

        const closeTicket = async () => {
            channel.delete();
            require('../../modules/transcript.js')(channel.id);

            bot.emit("ticketClosed", ticket, member, args.length > 0 ? args.join(" ") : undefined);

            if (config.Tickets.DMClosureReason) {
                const creatorMember = channel.guild.members.cache.get(ticket.creator);
                if (creatorMember)
                    creatorMember.send(Embed({
                        title: lang.TicketModule.Commands.Close.Embeds.DM.Title,
                        description: lang.TicketModule.Commands.Close.Embeds.DM.Description
                            .replace(/{ticket}/g, ticket.channel_name.split('-')[1])
                            .replace(/{reason}/g, args.length > 0 ? args.join(' ') : lang.TicketModule.Commands.Close.NoReason)
                    })).catch(err => { })
            }

            resolve();
        };

        if (closeConfirmation) {
            const msg = await channel.send(Embed({ title: lang.TicketModule.Commands.Close.Confirmation }));

            // React
            await msg.react('✅');
            await msg.react('❌');

            // Wait for the user to confirm or deny
            Utils.waitForReaction(['✅', '❌'], member.id, msg).then(reaction => {
                msg.delete();
                return reaction.emoji.name == '✅' ? closeTicket() : channel.send(Embed({ title: lang.TicketModule.Commands.Close.Canceled }));
            })
        } else closeTicket();
    })
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065