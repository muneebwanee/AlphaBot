const Utils = require("../../modules/utils.js");
const Discord = Utils.Discord;
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: 'avatar',
    run: async (bot, message, args) => {
        let user = Utils.ResolveUser(message) || message.member;
        let avatar = user.user.displayAvatarURL({ dynamic: true });
        if (!avatar.endsWith('?size=2048')) avatar += "?size=2048";
        message.channel.send(Embed({
            title: lang.Other.OtherCommands.Avatar.Title.replace(/{user}/g, user.user.username),
            image: avatar,
            author: {
                text: user.user.username,
                icon: user.user.displayAvatarURL({ dynamic: true })
            }
        }))
    },
    description: "View a user's avatar",
    usage: 'avatar [@user]',
    aliases: [

    ]
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065