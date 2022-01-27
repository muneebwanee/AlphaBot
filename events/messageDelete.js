const Utils = require('../modules/utils.js');
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = async (bot, message) => {
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0 && require('../modules/handlers/KeyHandler.js').verified) {
        if (message.channel.type == 'dm' || !config.Logs.Enabled.includes("MessageDeleted")) return;

        let logs = Utils.findChannel(config.Logs.Channels.MessageDelete, message.guild)

        if (!logs || message.author.bot) return;

        let embed = Embed({
            title: lang.LogSystem.MessageDeleted.Title,
            fields: [{
                name: lang.LogSystem.MessageDeleted.Fields[0],
                value: '<@' + message.author.id + '>'
            },
            {
                name: lang.LogSystem.MessageDeleted.Fields[1],
                value: '<#' + message.channel.id + '>'
            }],
            timestamp: new Date()
        })

        if (message.content.length > 1024) {
            embed.embed.fields.push({
                name: lang.LogSystem.MessageDeleted.Fields[2],
                value: message.content.substring(0, 1001)
            })
            embed.embed.fields.push({
                name: '\u200B',
                value: message.content.substring(1001, message.content.length)
            })
        } else {
            embed.embed.fields.push({
                name: lang.LogSystem.MessageDeleted.Fields[2],
                value: message.content
            })
        }

        if (message.attachments) {
            embed.embed.fields.push({
                name: lang.LogSystem.MessageDeleted.Fields[3],
                value: message.attachments.map((attachment, i) => {
                    return `**${attachment.name}** - [Click Here](${attachment.proxyURL})`
                }).join("\n")
            })
        }

        embed.embed.fields = embed.embed.fields.filter(field => {
            return field.value.length > 0 && field.name.length > 0
        })

        return logs.send(embed);
    }
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065