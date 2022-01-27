const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: 'slowmode',
    run: async (bot, message, args) => {
        let amount = 2;
        if (!args[0]) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));

        if (args[0].toLowerCase() == 'on') {
            if (!amount) amount = 5;
            message.channel.setRateLimitPerUser(amount, 'Slowmode enabled by ' + message.author.tag);
            message.channel.send(Embed({ title: lang.ModerationModule.Commands.Slowmode.Embeds.Enabled.Title, description: lang.ModerationModule.Commands.Slowmode.Embeds.Enabled.Descriptions[0], color: config.EmbedColors.Success }));

        } else if (args[0].toLowerCase() == 'off') {
            message.channel.setRateLimitPerUser(0, 'Slow mode disabled by ' + message.author.tag);
            message.channel.send(Embed({ title: lang.ModerationModule.Commands.Slowmode.Embeds.Disabled.Title, description: lang.ModerationModule.Commands.Slowmode.Embeds.Disabled.Description, color: config.EmbedColors.Success }));
        } else {
            amount = parseInt(args[0]);
            if (!amount) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Commands.Slowmode.Errors.InvalidTime, usage: module.exports.usage }));

            message.channel.setRateLimitPerUser(amount, 'Slowmode enabled by ' + message.author.tag);
            message.channel.send(Embed({ title: lang.ModerationModule.Commands.Slowmode.Embeds.Enabled.Title, description: lang.ModerationModule.Commands.Slowmode.Embeds.Enabled.Descriptions[1].replace(/{amount}/g, amount), color: config.EmbedColors.Success }));
        }
    },
    description: "Turn on or off slowmode",
    usage: 'slowmode <seconds/on/off>',
    aliases: []
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065