const Discord = require("discord.js");
const Utils = require("../../modules/utils.js")
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: 'clear',
    run: async (bot, message, args) => {
        let channel = Utils.ResolveChannel(message, 1, false, true);
        if (!channel) channel = message.channel;
        let error = false;

        if (args.length == 0) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));
        if (isNaN(args[0]) || parseInt(args[0]) < 1) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Commands.Clear.Errors.InvalidNumb, usage: module.exports.usage }));
        //await message.delete();

        let amount = parseInt(args[0]) + 1;
        let fullBulkDeleteAmts = new Array(Math.floor(amount / 100));
        let bulkDeleteAmts = [...fullBulkDeleteAmts, (amount - (fullBulkDeleteAmts.length * 100))];

        await Utils.asyncForEach(bulkDeleteAmts, async (amount, i) => {
            if (error) return;
            await channel.bulkDelete(amount ? amount : 100, false).then(messages => {
            }).catch(async err => {
                error = true;
                if (err.code == 50013) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Commands.Clear.Errors.BotNoPerms }))
                else if (err.code == 50034) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Commands.Clear.Errors.OlderThan14Days }))
                else {
                    console.log(err)
                    return message.channel.send(Embed({ preset: 'console' }));
                }
            });
            if ((i+1) !== bulkDeleteAmts.length) await Utils.delay(2)
        })

        if (!error) return message.channel.send(Embed({ title: lang.ModerationModule.Commands.Clear.Cleared.replace(/{amt}/g, args[0]), color: config.EmbedColors.Success })).then(msg => {
            if (msg && !msg.deleted) msg.delete({ timeout: 5000 })
        });
    },
    description: "Clear a certain amount of messages",
    usage: 'clear <amount> [channel]',
    aliases: [
        'purge'
    ]
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065