const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: 'removewarn',
    run: async (bot, message, args) => {
        let user = Utils.ResolveUser(message);
        let warningID = args[1];

        if (config.Moderation.Logs.Enabled && !Utils.findChannel(config.Moderation.Logs.Channel, message.guild)) return message.channel.send(Embed({ preset: 'console' }));
        if (!user || args.length < 2) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));

        const warnings = await Utils.variables.db.get.getWarnings(user.id);

        if (!warnings || warnings.length == 0) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Commands.Removewarn.Errors.NoHistory, usage: module.exports.usage }));

        const warning = await Utils.variables.db.get.getWarning(warningID);

        if (!warning) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Commands.Removewarn.Errors.InvalidID, usage: module.exports.usage }));
        await Utils.variables.db.update.punishments.removeWarning(warning.id);

        message.channel.send(Embed({ title: lang.ModerationModule.Commands.Removewarn.Embeds.Removed.Title, description: lang.ModerationModule.Commands.Removewarn.Embeds.Removed.Description.replace(/{id}/g, warning.id), color: config.EmbedColors.Success }));
        user.send(Embed({ title: lang.ModerationModule.Commands.Removewarn.Embeds.Notification.Title, description: lang.ModerationModule.Commands.Removewarn.Embeds.Notification.Description.replace(/{id}/g, warning.id), color: config.EmbedColors.Success })).catch(err => { });

        bot.emit('userUnpunished', "warn", user, message.member, warning)
    },
    description: "Remove a warning from a user",
    usage: 'remwarn <@user> <id>',
    aliases: ['remwarn', 'deletewarn', 'delwarn']
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065