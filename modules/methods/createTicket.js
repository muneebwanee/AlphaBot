const Discord = require("discord.js");
const Utils = require("../utils")
const Embed = Utils.Embed;
const { config, lang, embeds } = Utils.variables;

const increase = (string) => {
    const num = parseInt(string) + 1;
    return ('0'.repeat(4 - num.toString().length)) + num;
}

module.exports = async (bot, args, member, channel, autoDeleteMessages = false, delay = 10000, requireReason = config.Tickets.RequireReason, category_name = config.Tickets.Channel.Category) => {
    return new Promise(async resolve => {
        const deleteMessage = (msg) => {
            if (autoDeleteMessages) msg.delete({ timeout: delay });
        }
        const { user } = member;
        // Get the number of tickets that the user currently has open
        const userTickets = channel.guild.channels.cache.filter(c => /.+\-[0-9]{4}/.test(c.name)).filter(c => c.permissionOverwrites.find(o => o.type == 'member' && o.id == user.id)).size;
        // Get the limit from the config
        const ticketLimit = config.Tickets.LimitPerUser;
        // Get all tickets from the database
        const tickets = await Utils.variables.db.get.getTickets();
        // Get the newest ticket from the database
        const newestTicket = tickets.sort((a, b) => parseInt(b.channel_name.match(/\d+/)[0]) - parseInt(a.channel_name.match(/\d+/)[0]))[0];
        // Get the next ticket number
        const next_ticket_number = newestTicket ? (increase(newestTicket.channel_name.match(/\d+/)[0])) : '0000';

        // Support role
        const support = Utils.findRole(config.Tickets.SupportRole, channel.guild)
        const category = Utils.findChannel(category_name, channel.guild, 'category');

        if (config.Logs.Enabled.includes("Tickets")) {
            const logsChannel = Utils.findChannel(config.Logs.Channels.Tickets, channel.guild);
            if (!logsChannel) return channel.send(Embed({ preset: 'console' })).then(deleteMessage);
        }

        if (!support) return channel.send(Embed({ preset: 'console' })).then(deleteMessage);
        if (!category) return channel.send(Embed({ preset: 'console' })).then(deleteMessage);

        if (userTickets >= ticketLimit) return channel.send(Embed({ color: config.EmbedColors.Error, title: lang.TicketModule.Commands.New.Errors.MaxTickets.replace(/{ticketlimit}/g, ticketLimit) })).then(deleteMessage)
        if (requireReason && args.length == 0) return channel.send(Embed({ preset: 'invalidargs', usage: "new <reason>" })).then(deleteMessage);

        let topic;
        if (config.Tickets.Channel.Topic) {
            if (typeof config.Tickets.Channel.Topic == "string") {
                if (args.length > 0) {
                    topic = config.Tickets.Channel.Topic.replace(/{user-mention}/g, `<@${user.id}>`).replace(/{user-tag}/g, user.tag).replace(/{time}/g, new Date().toLocaleString()).replace(/{id}/g, next_ticket_number).replace(/{reason}/g, args)
                } else {
                    topic = config.Tickets.Channel.Topic.replace(/{user-mention}/g, `<@${user.id}>`).replace(/{user-tag}/g, user.tag).replace(/{time}/g, new Date().toLocaleString()).replace(/{id}/g, next_ticket_number).replace(/{reason}/g, 'N/A')
                }
            } else {
                topic = " "
                console.log(Utils.warningPrefix + " The Topic setting for the Ticket System must be text, not a boolean")
            }
        } else {
            topic = " "
        }

        channel.guild.channels.create(`ticket-${next_ticket_number}`, {
            type: 'text',
            permissionOverwrites: [{
                id: channel.guild.id,
                deny: ['VIEW_CHANNEL', 'SEND_MESSAGES']
            }, {
                id: support.id,
                allow: ['VIEW_CHANNEL', 'SEND_MESSAGES']
            }, {
                id: user.id,
                allow: ['VIEW_CHANNEL', 'SEND_MESSAGES']
            }, {
                id: bot.user.id,
                allow: ['VIEW_CHANNEL', 'SEND_MESSAGES']
            }],
            parent: category,
            topic: topic
        }).then(async ch => {
            channel.send(Embed({ title: lang.TicketModule.Commands.New.Embeds.Created.Title, description: lang.TicketModule.Commands.New.Embeds.Created.Description.replace(/{channel}/g, `<#${ch.id}>`), timestamp: new Date() })).then(deleteMessage);
            if (config.Tickets.PingSupport) ch.send(`<@&${support.id}>`);
            if (config.Tickets.PingUser) ch.send(`<@${user.id}>`);

            ch.send(Utils.setupEmbed({
                configPath: embeds.Embeds.Ticket,
                variables: [
                    ...Utils.userVariables(member, "user"),
                    { searchFor: /{reason}/g, replaceWith: args.join(" ") || "None" },
                    { searchFor: /{bot-pfp}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) },
                ]
            }))

            let ticket = {
                guild: channel.guild.id,
                channel_id: ch.id,
                channel_name: ch.name,
                creator: user.id,
                reason: args.length > 0 ? args.join(" ") : 'None'
            }

            await Utils.variables.db.update.tickets.createTicket(ticket)
            bot.emit('ticketCreated', ticket, ch, args.length > 0 ? args.join(" ") : undefined)
            resolve(ch);
        })
    })
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065