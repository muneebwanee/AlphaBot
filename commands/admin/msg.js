const Utils = require("../../modules/utils.js")
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: 'msg',
    run: async (bot, message, args, { prefixUsed, commandUsed }) => {
        if (args.length < 3) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));
        let content = message.content.replace(prefixUsed + commandUsed, '').replace(/(<@[0-9]{18}>|<@![0-9]{18}>|<@&[0-9]{18}>|users|tickets)\s+(normal|embed|)/g, '')
        
        if (!["normal", "embed"].includes(args[1].toLowerCase())) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));

        async function send(channel, sendError = false) {
            if (args[1].toLowerCase() == 'normal') channel.send(content).catch(err => {
                if (sendError) message.channel.send(Embed({ preset: 'error', description: lang.AdminModule.Commands.Msg.CouldntSend }));
                return false
            })

            else if (args[1].toLowerCase() == 'embed') channel.send(Embed({ description: content })).catch(err => {
                if (sendError) message.channel.send(Embed({ preset: 'error', description: lang.AdminModule.Commands.Msg.CouldntSend }));
                return false
            })

            return true
        }

        // USER
        let user = message.mentions.users.first()
        if (user) {
            let sent = await send(user, true);
            if (sent) await message.channel.send(Embed({ color: config.EmbedColors.Success, title: lang.AdminModule.Commands.Msg.Sent }));
            return;
        }

        // ROLE
        let msgRole = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
        if (msgRole) {
            let members = message.guild.members.cache.filter(u => u.roles.cache.has(msgRole.id));
            await members.forEach(async m => {
                await send(m)
            })
            await message.channel.send(Embed({ color: config.EmbedColors.Success, title: lang.AdminModule.Commands.Msg.Sent }));
            return;
        }

        // ALL USERS
        if (args[0].toLowerCase() == 'users') {
            message.guild.members.cache.forEach(send);
            await message.channel.send(Embed({ color: config.EmbedColors.Success, title: lang.AdminModule.Commands.Msg.Sent }));
            return;
        }

        // TICKETS
        else if (args[0].toLowerCase() == 'tickets') {
            let tickets = await Utils.getOpenTickets(message.guild);
            tickets.forEach(send);
            await message.channel.send(Embed({ color: config.EmbedColors.Success, title: lang.AdminModule.Commands.Msg.Sent }))
        } else return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));
    },
    description: "Message all or certain users",
    usage: 'msg <@user/@role/users/tickets> <normal/embed> <message>',
    aliases: ['message']
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065