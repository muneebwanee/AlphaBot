const Utils = require("../../modules/utils.js");
const lang = Utils.variables.lang;
const config = Utils.variables.config;
const Embed = Utils.Embed;

module.exports = {
    name: 'setprefix',
    run: async (bot, message, args) => {
        if (args.length == 0) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));

        await Utils.variables.db.update.prefixes.updatePrefix(message.guild.id, args[0]);
        
        message.channel.send(Embed({
            title: lang.ManagementModule.Commands.Setprefix.Title,
            description: lang.ManagementModule.Commands.Setprefix.Description.replace(/{prefix}/g, args[0]),
            color: config.EmbedColors.Success
        }));
    },
    description: "Set the bot's prefix",
    usage: 'setprefix <prefix>',
    aliases: []
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065