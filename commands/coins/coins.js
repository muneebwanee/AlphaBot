const Discord = require("discord.js");
const Utils = require("../../modules/utils.js")
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: 'coins',
    run: async (bot, message, args) => {
        if (args.length == 0) return message.channel.send(Embed({
            author: {
                icon: message.member.user.displayAvatarURL({ dynamic: true }),
                text: message.member.user.username
            },
            title: lang.CoinModule.Commands.Coins.Embeds.YourCoins.Title, 
            description: lang.CoinModule.Commands.Coins.Embeds.YourCoins.Description.replace(/{coins}/g, (await Utils.variables.db.get.getCoins(message.member)).toLocaleString()) }));
        else {
            let user = Utils.ResolveUser(message);
            if (!user) return message.channel.send(Embed({ preset: 'error', description: lang.GlobalErrors.InvalidUser, usage: module.exports.usage }));
            let coins = await Utils.variables.db.get.getCoins(user);
            if (!coins || !parseInt(coins)) coins = 0
            message.channel.send(Embed({
                author: {
                    icon: user.user.displayAvatarURL({ dynamic: true }),
                    text: user.user.username
                },
                title: lang.CoinModule.Commands.Coins.Embeds.UserCoins.Title.replace(/{user}/g, user.user.username), 
                description: lang.CoinModule.Commands.Coins.Embeds.UserCoins.Description.replace(/{user}/g, user).replace(/{coins}/g, coins >= 0 ? coins.toLocaleString() : 'unknown') }));
        }
    },
    description: "Check how many coins you or another user has",
    usage: 'coins [@user]',
    aliases: [
        'bal',
        'balance'
    ]
}


// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065