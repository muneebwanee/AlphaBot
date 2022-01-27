const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const Discord = Utils.Discord;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: 'history',
    run: async (bot, message, args) => {
        let user = Utils.ResolveUser(message);
        let embed = new Discord.MessageEmbed()
            .setColor(config.EmbedColors.Default)

        if (!user) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));

        const history = await Utils.variables.db.get.getPunishmentsForUser(user.id);

        embed.setAuthor(user.user.username, user.user.displayAvatarURL({ dynamic: true }))
        embed.setTitle(lang.ModerationModule.Commands.History.Title);

        if (!history || history.length == 0) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Commands.History.NoHistory }));

        await Promise.all(history.map(async function (punishment) {

            return new Promise(async resolve => {
                let ineffect = lang.ModerationModule.Commands.History.InEffect[0];
                const displayType = punishment.type ? (punishment.type.charAt(0).toUpperCase() + punishment.type.substr(1, punishment.type.length)) : '';

                if (punishment.type == 'kick') {
                    return resolve(embed.addField(lang.ModerationModule.Commands.History.FieldTitle.replace(/{id}/g, punishment.id), `${lang.ModerationModule.Commands.History.Fields[0]}${displayType}\n${lang.ModerationModule.Commands.History.Fields[1]}<@${punishment.executor}>\n${lang.ModerationModule.Commands.History.Fields[2]}${punishment.reason}\n${lang.ModerationModule.Commands.History.Fields[4]}${new Date(punishment.time).toLocaleString()}`));
                } else if (punishment.type == 'tempban' || punishment.type == 'tempmute') {
                    return resolve(embed.addField(lang.ModerationModule.Commands.History.FieldTitle.replace(/{id}/g, punishment.id), `${lang.ModerationModule.Commands.History.Fields[0]}${displayType}\n${lang.ModerationModule.Commands.History.Fields[1]}<@${punishment.executor}>\n${lang.ModerationModule.Commands.History.Fields[3]}${punishment.reason}\n${lang.ModerationModule.Commands.History.Fields[3]}${Utils.DDHHMMSSfromMS(punishment.length)}\n${lang.ModerationModule.Commands.History.Fields[4]}${new Date(punishment.time).toLocaleString()}`));
                } else if (punishment.type == 'ban') {
                    await Utils.checkBan(message.guild, punishment.user)
                        .then(res => {
                            if (!res) ineffect = lang.ModerationModule.Commands.History.InEffect[1]
                            else ineffect = lang.ModerationModule.Commands.History.InEffect[0];
                        })
                } else if (punishment.type == 'blacklist') {
                    //if (!message.guild.member(punishment.user).roles.cache.find(r => r.name == config.Punishment_System.Blacklist_Role)) ineffect = lang.ModerationModule.Commands.History.InEffect[1];
                } else if (punishment.type == 'mute') {
                    if (!message.guild.member(punishment.user).roles.cache.find(r => r.name == config.Moderation.MuteRole)) ineffect = lang.ModerationModule.Commands.History.InEffect[1];
                }

                return resolve(embed.addField(lang.ModerationModule.Commands.History.FieldTitle.replace(/{id}/g, punishment.id), `${lang.ModerationModule.Commands.History.Fields[0]}${displayType}\n${lang.ModerationModule.Commands.History.Fields[1]}<@${punishment.executor}>\n${lang.ModerationModule.Commands.History.Fields[2]}${punishment.reason}\n${lang.ModerationModule.Commands.History.Fields[4]}${new Date(punishment.time).toLocaleString()}\n${lang.ModerationModule.Commands.History.Fields[5]}${ineffect}`));
            })
        }))

        message.channel.send(embed);
    },
    description: "View the punishment history of a user",
    usage: 'history <@user>',
    aliases: []
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065