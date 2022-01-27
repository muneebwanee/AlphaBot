const Discord = require("discord.js");
const Utils = require("../../modules/utils.js")
const Embed = Utils.Embed;
const { config, lang, embeds } = Utils.variables;

module.exports = {
    name: 'cointop',
    run: async (bot, message, args) => {
        let page = +args[0] || 1;

        const allCoins = await Utils.variables.db.get.getCoins();

        if (page > Math.ceil(allCoins.length / config.Leaderboards.UsersPerPage.Coins)) page = 1;

        const coins = allCoins
            .filter(c => c.guild == message.guild.id &&
                c.user &&
                c.user.toLowerCase() !== 'unknown' &&
                c.coins &&
                c.coins >= 0 &&
                (config.Leaderboards.FilterUnknown ? !!message.guild.member(c.user) : true)
            )
            .sort((a, b) => b.coins - a.coins)
            .slice((page - 1) * config.Leaderboards.UsersPerPage.Coins, config.Leaderboards.UsersPerPage.Coins * page)
            .map((coins, i) =>
                `**${++i + (page - 1) * config.Leaderboards.UsersPerPage.Coins}.** \`\`${coins.coins.toLocaleString()}\`\` - ${message.guild.member(coins.user) || lang.CoinModule.CointopUnknownUser}`
            );

        if (coins.length < 1) return message.channel.send(Utils.setupEmbed({
            configPath: embeds.Embeds.CoinTop,
            description: lang.CoinModule.CointopLeaderboardEmpty,
            variables: [
                { searchFor: /{current-page}/g, replaceWith: page },
                { searchFor: /{max-pages}/g, replaceWith: Math.ceil(allCoins.length / config.Leaderboards.UsersPerPage.Coins) },
                { searchFor: /{totalcoins}/g, replaceWith: "0" },
                { searchFor: /{bot-pfp}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) }
            ]
        }));


        const total = allCoins.map(c => c.coins || 0).reduce((acc, cv) => acc + cv);

        message.channel.send(Utils.setupEmbed({
            configPath: embeds.Embeds.CoinTop,
            description: coins.join('\n'),
            variables: [
                { searchFor: /{current-page}/g, replaceWith: page },
                { searchFor: /{max-pages}/g, replaceWith: Math.ceil(allCoins.length / config.Leaderboards.UsersPerPage.Coins) },
                { searchFor: /{totalcoins}/g, replaceWith: total.toLocaleString() },
                { searchFor: /{bot-pfp}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) }
            ]
        }));
    },
    description: "Check the coin leaderboard",
    usage: 'cointop [page]',
    aliases: [
        'coinlb'
    ]
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065