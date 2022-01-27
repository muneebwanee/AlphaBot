const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const Discord = Utils.Discord;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: 'daily',
    run: async (bot, message, args) => {
        let time = (new Date(Math.floor(await Utils.variables.db.get.getDailyCoinsCooldown(message.member)))).getTime();
        if (time > (new Date()).getTime()) return message.channel.send(Embed({ preset: 'error', description: lang.CoinModule.Commands.Daily.Cooldown.replace(/{time}/g, Utils.getTimeDifference(new Date(), time)) }));

        let nextTime = new Date()
        nextTime.setHours(nextTime.getHours() + 24);

        await Utils.variables.db.update.coins.updateCoins(message.member, config.Coins.Amounts.Daily, 'add');
        await Utils.variables.db.update.coins.setDailyCooldown(message.member, nextTime.getTime())
        message.channel.send(Embed({ title: lang.CoinModule.Commands.Daily.Collected.replace(/{coins}/g, config.Coins.Amounts.Daily.toLocaleString()), color: config.EmbedColors.Success }))
    },
    description: "Get your daily coins",
    usage: 'daily',
    aliases: ['dailycoins']
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065