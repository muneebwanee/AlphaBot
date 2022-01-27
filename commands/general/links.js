const Discord = require("discord.js");
const Utils = require("../../modules/utils.js")
const Embed = Utils.Embed;
const { config, lang, embeds } = Utils.variables;

module.exports = {
    name: 'links',
    run: async (bot, message, args) => {
        let fields = Object.keys(config.Links).map(name => {
            return { name: name, value: config.Links[name] }
        })

        message.channel.send(Utils.setupEmbed({
            configPath: embeds.Embeds.Links,
            fields: fields
        }))
    },
    description: "View links related to the Discord server",
    usage: 'links',
    aliases: [],
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065