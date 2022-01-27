const Discord = require("discord.js");
const Utils = require("../../modules/utils.js")
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: 'setactivity',
    run: async (bot, message, args) => {
        message.channel.send(Embed({
            title: lang.ManagementModule.Commands.Setactivity.Embeds.Setup.Title.replace(/{pos}/g, "1/2"),
            description: lang.ManagementModule.Commands.Setactivity.Embeds.Setup.Descriptions[0]
        })).then(async msg => {
            let emojis = ['🎮', '📺', '📹', '👂', '❌']
            emojis.forEach(emoji => {
                msg.react(emoji).catch(err => { })
            })

            Utils.waitForReaction(emojis, message.author.id, msg).then(async reaction => {
                msg.delete();
                let type;
                if (reaction.emoji.name == '🎮') {
                    type = 'PLAYING'
                } else if (reaction.emoji.name == '📺') {
                    type = 'WATCHING'
                } else if (reaction.emoji.name == '📹') {
                    type = 'STREAMING'
                } else if (reaction.emoji.name == '👂') {
                    type = 'LISTENING'
                } else if (reaction.emoji.name == '❌') {
                    message.channel.send(Embed({ title: lang.ManagementModule.Commands.Setactivity.Embeds.Updated.Title, description: lang.ManagementModule.Commands.Setactivity.Embeds.Updated.Descriptions[0], color: config.EmbedColors.Success }))
                    return await Utils.variables.db.update.status.setStatus('', '')
                };

                message.channel.send(Embed({
                    title: lang.ManagementModule.Commands.Setactivity.Embeds.Setup.Title.replace(/{pos}/g, "2/2"),
                    description: lang.ManagementModule.Commands.Setactivity.Embeds.Setup.Descriptions[1]
                })).then(ms => {
                    message.channel.awaitMessages(msg => msg.author.id == message.author.id, { max: 1, time: 60000 }).then(async m => {
                        ms.delete();
                        m.first().delete();

                        await Utils.variables.db.update.status.setStatus(type, m.first().content);
                        message.channel.send(Embed({
                            title: lang.ManagementModule.Commands.Setactivity.Embeds.Updated.Title,
                            description: lang.ManagementModule.Commands.Setactivity.Embeds.Updated.Descriptions[1].replace(/{activity}/g, type.charAt(0) + type.substring(1).toLowerCase() + ' **' + m.first().content + '**')
                        }))
                    })
                });
            })
        });
    },
    description: "Set the bot's activity",
    usage: 'setactivty',
    aliases: []
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065