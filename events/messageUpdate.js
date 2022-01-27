const Utils = require('../modules/utils.js');
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = async (bot, oldMessage, newMessage) => {
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0 && require('../modules/handlers/KeyHandler.js').verified) {
        if (newMessage.channel.type == 'dm' || !config.Logs.Enabled.includes("MessageEdited")) return;

        let channel = Utils.findChannel(config.Logs.Channels.MessageEdit, oldMessage.guild)

        if (!channel || oldMessage.author.bot || oldMessage.content == newMessage.content) return;

        let embed = Embed({
            title: lang.LogSystem.MessageUpdated.Title,
            description: lang.LogSystem.MessageUpdated.Description.replace(/{messageurl}/g, oldMessage.url),
            fields: [{
                name: lang.LogSystem.MessageUpdated.Fields[0],
                value: '<@' + oldMessage.author.id + '>'
            },
            {
                name: lang.LogSystem.MessageUpdated.Fields[1],
                value: '<#' + oldMessage.channel.id + '>'
            },
            {
                name: lang.LogSystem.MessageUpdated.Fields[2],
                value: '```' + oldMessage.content + '```'
            },
            {
                name: lang.LogSystem.MessageUpdated.Fields[3],
                value: '```' + newMessage.content + '```'
            }],
            timestamp: new Date()
        })

        channel.send(embed);

        // ANTI ADVERTISEMENT SYSTEM
        if (newMessage.content && Utils.hasAdvertisement(newMessage.content)) {
            if (config.AntiAdvertisement.Chat.Enabled && !Utils.hasPermission(newMessage.member, config.AntiAdvertisement.BypassRole)) {
                if (["ticket-", "application-"].some(name => newMessage.channel.name.startsWith(name))) return;
                if (config.AntiAdvertisement.Whitelist.Channels.some(channel => newMessage.channel.name == channel || newMessage.channel.id == channel)) return;

                newMessage.delete();
                newMessage.channel.send(Embed({ title: lang.AntiAdSystem.MessageAdDetected.Title, description: lang.AntiAdSystem.MessageAdDetected.Description.replace(/{user}/g, newMessage.author) })).then(msg => { msg.delete({ timeout: 5000 }) });

                if (config.AntiAdvertisement.Chat.Logs.Enabled) {
                    const logs = Utils.findChannel(config.AntiAdvertisement.Chat.Logs.Channel, newMessage.guild);

                    if (logs) logs.send(Embed({
                        title: lang.AntiAdSystem.Log.Title,
                        fields: [
                            {
                                name: lang.AntiAdSystem.Log.Fields[0],
                                value: `<@${newMessage.author.id}> (${newMessage.author.tag})`
                            },
                            {
                                name: lang.AntiAdSystem.Log.Fields[1],
                                value: `<#${newMessage.channel.id}>`
                            },
                            {
                                name: lang.AntiAdSystem.Log.Fields[2],
                                value: newMessage.content
                                    .split(" ")
                                    .map(word => {
                                        if (word && Utils.hasAdvertisement(word)) return `**${word}**`;
                                        else return word;
                                    })
                                    .join(" ")
                            }
                        ]
                    }))
                }
            }
        }
    }
}
// 239232   8501   2161065    __%%   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065