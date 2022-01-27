const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const lang = Utils.variables.lang;

module.exports = {
    name: 'serverinfo',
    run: async (bot, message, args) => {
        let region;

        if (message.guild.region.includes('-')) region = message.guild.region.split('-')[0].charAt(0).toUpperCase() + message.guild.region.split('-')[0].substring(1) + ' ' + message.guild.region.split('-')[1].charAt(0).toUpperCase() + message.guild.region.split('-')[1].substring(1)
        else region = message.guild.region.charAt(0).toUpperCase() + message.guild.region.substring(1);

        let GuildChannels = message.guild.channels.cache.filter(channel => channel.type == "text" && !(channel.name.startsWith("ticket-") || channel.name.startsWith("application-")));
        let channels = GuildChannels.map(c => ' <#' + c.id + '>').toString();
        if (channels.length > 1024) {
            while (channels.length > 1024) {
                channels = channels.substring(0, channels.length - 22) + lang.Other.OtherCommands.Serverinfo.More
                channels = channels.replace(/<#\s|\s>/gm, '');
            }
        }

        let roles = message.guild.roles.cache.map(r => ` <@&${r.id}>`).toString().replace(`<@&${message.guild.id}>,`, '');
        if (roles.length > 1024) {
            while (roles.length > 1024) {
                roles = roles.substring(0, roles.length - 22) + lang.Other.OtherCommands.Serverinfo.More
                roles = roles.replace(/<@\s|\s>/gm, '');
            }
        }

        const members = await message.guild.members.fetch();

        message.channel.send(Embed({
            title: message.guild.name,
            thumbnail: message.guild.iconURL,
            fields: [
                { name: lang.Other.OtherCommands.Serverinfo.Fields[0], value: '<@' + message.guild.owner.id + '>' },
                { name: lang.Other.OtherCommands.Serverinfo.Fields[1], value: message.guild.createdAt.toLocaleString() },
                {
                    name: lang.Other.OtherCommands.Serverinfo.Fields[2].Name,
                    value: lang.Other.OtherCommands.Serverinfo.Fields[2].Value
                        .replace(/{humans}/g, members.filter(m => !m.user.bot).size)
                        .replace(/{bots}/g, members.filter(m => m.user.bot).size)
                        .replace(/{total}/g, message.guild.memberCount)
                },
                { name: lang.Other.OtherCommands.Serverinfo.Fields[3], value: region },
                { name: lang.Other.OtherCommands.Serverinfo.Fields[4].replace(/{amt}/g, GuildChannels.size), value: channels },
                { name: lang.Other.OtherCommands.Serverinfo.Fields[5].replace(/{amt}/g, message.guild.roles.cache.size), value: roles },
                { name: "Emojis [" + message.guild.emojis.cache.size + "]", value: message.guild.emojis.cache.size ? message.guild.emojis.cache.map(emoji => emoji.toString()).join(" ") : "None" }
            ]
        }));
    },
    description: "View server information",
    usage: 'serverinfo',
    aliases: []
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065