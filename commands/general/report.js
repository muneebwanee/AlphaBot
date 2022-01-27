const Discord = require("discord.js");
const Utils = require("../../modules/utils.js")
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;
const fs = require("fs");

module.exports = {
    name: 'report',
    run: async (bot, message, args) => {
        const user = Utils.ResolveUser(message);
        const channel = Utils.findChannel(config.Channels.Reports, message.guild)
        const reason = args.slice(1).join(" ")

        if (!channel) return message.channel.send(Embed({ preset: 'console' }))
        if (args.length == 0) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));
        if (!user) return message.channel.send(Embed({ preset: 'error', description: lang.GlobalErrors.InvalidUser, usage: module.exports.usage }));
        if (user.user.bot) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Commands.Report.Errors.ReportBot }));
        if (user.id === message.author.id) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Commands.Report.Errors.ReportSelf }));
        if (args.length < 2) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Commands.Report.Errors.InvalidReason, usage: module.exports.usage }));

        channel.send(Embed({
            title: lang.ModerationModule.Commands.Report.Embeds.Report.Title,
            fields: [
                { name: lang.ModerationModule.Commands.Report.Embeds.Report.Fields[0], value: '<@' + user.id + '>' },
                { name: lang.ModerationModule.Commands.Report.Embeds.Report.Fields[1], value: '<@' + message.author.id + '>' },
                { name: lang.ModerationModule.Commands.Report.Embeds.Report.Fields[2], value: reason },
            ],
            timestamp: new Date()
        }))

        message.delete();
        message.channel.send(Embed({ title: lang.ModerationModule.Commands.Report.Embeds.Reported.Title, description: lang.ModerationModule.Commands.Report.Embeds.Reported.Description, timestamp: new Date() })).then(msg => msg.delete({ timeout: 10000 }));
    },
    description: "Report a user in the Discord server",
    usage: 'report <@user> <reason>',
    aliases: []
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065