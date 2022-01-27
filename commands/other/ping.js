const Utils = require("../../modules/utils.js")
const Embed = Utils.Embed;
const embeds = Utils.variables.embeds;

module.exports = {
    name: 'ping',
    run: async (bot, message, args) => {

        let apiPing = Math.round(1000 * bot.ws.ping) / 1000;

        message.channel.send(Utils.setupEmbed({
            configPath: embeds.Embeds.Ping[0],
            variables: [
                { searchFor: /{api-ping}/g, replaceWith: apiPing }
            ]
        })).then(msg => {
            msg.edit(Utils.setupEmbed({
                configPath: embeds.Embeds.Ping[1],
                variables: [
                    { searchFor: /{api-ping}/g, replaceWith: apiPing },
                    { searchFor: /{bot-ping}/g, replaceWith: msg.createdTimestamp - message.createdTimestamp }
                ]
            }))
        })
    },
    description: "Check the bot's latency",
    usage: 'ping',
    aliases: [
        'latency'
    ]
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065