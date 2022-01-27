const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const Discord = Utils.Discord;
const config = Utils.variables.config;
const db = Utils.variables.db;
const lang = Utils.variables.lang;

module.exports = {
    name: 'pay',
    run: async (bot, message, args) => {
        let user = Utils.ResolveUser(message, 0);
        const senderCoins = await db.get.getCoins(message.member);

        if (args.length < 2) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));
        if (!user) return message.channel.send(Embed({ preset: 'error', description: lang.GlobalErrors.InvalidUser, usage: module.exports.usage }));
        if (user.id == message.author.id) return message.channel.send(Embed({ preset: 'error', description: lang.CoinModule.Commands.Pay.Errors.PaySelf }));
        if (user.user.bot) return message.channel.send(Embed({ preset: 'error', description: lang.CoinModule.Commands.Pay.Errors.PayBot }))
        if (!parseInt(args[1]) || parseInt(args[1]) < 1) return message.channel.send(Embed({ preset: 'error', description: lang.CoinModule.Commands.Pay.Errors.InvalidAmount, usage: module.exports.usage }));
        if (senderCoins < parseInt(args[1])) return message.channel.send(Embed({ preset: 'error', description: lang.CoinModule.Errors.NotEnoughCoins, usage: module.exports.usage }));
        const receiverCoins = await db.get.getCoins(user);

        await db.update.coins.updateCoins(message.member, parseInt(args[1]), 'remove');
        await db.update.coins.updateCoins(user, parseInt(args[1]), 'add');
        await message.channel.send(Embed({
            title: lang.CoinModule.Commands.Pay.Embed.Title,
            color: config.EmbedColors.Success,
            description: lang.CoinModule.Commands.Pay.Embed.Description.replace(/{amt}/g, parseInt(args[1]).toLocaleString()).replace(/{user}/g, '<@' + user.user.id + '>'),
            fields: [
                { name: lang.CoinModule.Commands.Pay.Embed.Fields[0], value: `${senderCoins.toLocaleString()} **->** ${(await db.get.getCoins(message.member)).toLocaleString()}`, inline: true},
                { name: lang.CoinModule.Commands.Pay.Embed.Fields[1], value: `${receiverCoins ? receiverCoins.toLocaleString() : 0} **->** ${(await db.get.getCoins(user)).toLocaleString()}`, inline: true}
            ]
        }))
    },
    description: "Send money to a user",
    usage: 'pay <@user> <amount>',
    aliases: []
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065