const Utils = require('../../modules/utils')
const Embed = Utils.Embed;
const { config, lang } = Utils.variables;

module.exports = {
    name: "react",
    run: async (bot, message, args) => {
        if (args.length < 2 || !/[0-9]{18}/.test(args[0])) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));

        message.channel.messages.fetch(args[0])
            .then(msg => {
                let customEmojiRegex = /<:.+:[0-9]{18}>/
                let emoji = customEmojiRegex.test(args[1]) ? bot.emojis.cache.find(e => e.id == args[1].split(":")[2].substring(0, 18)) : undefined

                if (customEmojiRegex.test(args[1]) && !emoji) return message.channel.send(Embed({ preset: 'error', description: lang.AdminModule.Commands.React.InvalidEmoji }))

                msg.react(emoji || args[1])
                    .then(m => {
                        message.delete();
                        message.channel.send(Embed({ title: lang.AdminModule.Commands.React.Reacted.replace(/{emoji}/g, args[1]) })).then(m => m.delete({ timeout: 3000 }))
                    })
                    .catch(err => {
                        if (err.message == "Unknown Emoji") return message.channel.send(Embed({ preset: 'error', description: lang.AdminModule.Commands.React.InvalidEmoji }))
                        else {
                            console.log(err)
                            return message.channel.send(Embed({ preset: "console" }));
                        }
                    })
            })
            .catch(err => {
                if (err.message == "Unknown Message") return message.channel.send(Embed({ preset: 'error', description: lang.AdminModule.Commands.React.InvalidMessage }));
                else {
                    console.log(err)
                    return message.channel.send(Embed({ preset: 'console' }));
                }
            })
    },
    description: "React to a message with an emoji",
    usage: "react <message id> <emoji>",
    aliases: []
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065