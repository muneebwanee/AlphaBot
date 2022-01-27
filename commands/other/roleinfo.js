const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const Discord = Utils.Discord;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: 'roleinfo',
    run: async (bot, message, args) => {
        let role = message.mentions.roles.first() || message.guild.roles.cache.find(r => r.name == args.join(" "));
        let members = "";
        let i = 0;

        if (!role) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));

        role.members.forEach(m => {
            i++
            if (i >= 12) return;
            if (i == 11) return members += '...';
            members += ' <@' + m.user.id + '>'
        })

        message.channel.send(Embed({
            color: role.hexColor,
            title: lang.Other.OtherCommands.Roleinfo.Title,
            description: `<@&${role.id}>`,
            fields: [
                { name: lang.Other.OtherCommands.Roleinfo.Fields[0], value: role.createdAt.toLocaleString(), inline: true },
                { name: '\u200B', value: '\u200B', inline: true },
                { name: lang.Other.OtherCommands.Roleinfo.Fields[1], value: role.position, inline: true },
                { name: lang.Other.OtherCommands.Roleinfo.Fields[2], value: role.permissions.toArray().map(perm => perm.toLowerCase().replace(/_/g, ' ')).join(", "), inline: true },
                { name: '\u200B', value: '\u200B', inline: true },
                { name: lang.Other.OtherCommands.Roleinfo.Fields[3].replace(/{amt}/g, role.members.size ? role.members.size : 0), value: members ? members : lang.Other.OtherCommands.Roleinfo.NoMembers, inline: true }
            ],
            footer: { text: lang.Other.OtherCommands.Roleinfo.Footer.replace(/{id}/g, role.id), icon: bot.user.displayAvatarURL({ dynamic: true }) }
        }));
    },
    description: "View information on a role",
    usage: 'roleinfo <@role>',
    aliases: []
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065