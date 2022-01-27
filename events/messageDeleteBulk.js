const Utils = require('../modules/utils.js');
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = async (bot, m) => {
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0 && require('../modules/handlers/KeyHandler.js').verified) {
        if (m.first().channel.type == 'dm' || !config.Logs.Enabled.includes("MessagesDeleted")) return;

        let msgs = m.array()
        let channel = Utils.findChannel(config.Logs.Channels.MessageDeleteBulk, msgs[0].guild)

        if (!channel || msgs[0].channel.type == "dm") return;

        let embed = Embed({
            title: lang.LogSystem.MessagesBulkDeleted.Title,
            fields: [
                {
                    name: lang.LogSystem.MessagesBulkDeleted.Fields[0],
                    value: '<#' + msgs[0].channel.id + '>'
                }],
            timestamp: new Date()
        })

        async function fixField(field) {
            let messages = msgs.map(m => {

                let msgInfo = `**${m.author.tag}** | *${m.createdAt.toLocaleString()}* | `

                let content = "";
                let embeds = "";
                let attachments = "";
                if (m.content) {
                    content = Utils.Discord.Util.escapeMarkdown(m.content)
                }

                if (m.embeds.length) {
                    let title = m.embeds[0].title
                    let description = m.embeds[0].description
                    let newLine = embeds.length || content.length ? "\n" : ""
                    embeds = `${newLine}**Embed:** ${title || description}`
                }
                if (m.attachments.size) {
                    let newLine = embeds.length || content.length ? "\n" : ""
                    attachments = `${newLine}**Attachment:** [Click Here](${m.attachments.array()[0].proxyURL})`
                }

                return msgInfo + content + embeds + attachments
            })
            let fields = [];

            await Utils.asyncForEach(messages, async msg => {
                if (fields.length == 0) {
                    fields.push({
                        name: field.name,
                        value: msg + "\n",
                        inline: field.inline ? true : false
                    })
                } else {
                    if ((fields[fields.length - 1].value.length + msg.length) > 1024) {
                        fields.push({
                            name: '\u200B',
                            value: msg + "\n",
                            inline: field.inline ? true : false
                        })
                    } else {
                        fields[fields.length - 1].value = fields[fields.length - 1].value + msg + "\n";
                    }
                }
            })
            return fields;
        }


        let fields = await fixField({
            name: lang.LogSystem.MessagesBulkDeleted.Fields[1],
            value: undefined,
            inline: false
        })
        embed.embed.fields = [...embed.embed.fields, ...fields]

        return channel.send(embed).catch(async err => {
            channel.send(Embed({
                color: config.Error_Color,
                title: lang.LogSystem.MessagesBulkDeleted.Title,
                description: lang.LogSystem.MessagesBulkDeleted.TooLong.replace(/{paste}/g, await Utils.paste(embed.embed.fields.map(field => {
                    return `${field.name}\n${field.value}\n\n`
                })))
            }))
        });
    }
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065