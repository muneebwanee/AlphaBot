const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const Discord = Utils.Discord;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: 'coinflip',
    run: async (bot, message, args) => {
        let coin = { 'Head': lang.FunModule.Commands.Coinflip.HeadIcon, 'Tail': lang.FunModule.Commands.Coinflip.TailIcon }
        let side = Object.keys(coin)[Math.floor(Math.random() * 2)];

        if (!args[0]) return message.channel.send(Embed({
            title: lang.FunModule.Commands.Coinflip.Embeds.Normal.Title,
            description: lang.FunModule.Commands.Coinflip.Embeds.Normal.Description.replace(/{result}/g, side),
            thumbnail: Object.values(coin)[Object.keys(coin).indexOf(side)],
            footer: {
                text: lang.FunModule.Commands.Coinflip.Embeds.Normal.Footer.replace(/{user}/g, message.author.tag),
                icon: message.author.displayAvatarURL({ dynamic: true })
            }
        }))
        else {
            args[0] = args[0].toLowerCase().replace('s', '');

            if (!args[1] || !['head', 'tail'].includes(args[0]) || isNaN(args[1])) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));
            if (args[1] > await Utils.variables.db.get.getCoins(message.member)) return message.channel.send(Embed({ preset: 'error', description: lang.CoinModule.Errors.NotEnoughCoins }));

            const win = side.toLowerCase() == args[0] ? true : false;

            const currentCoins = await Utils.variables.db.get.getCoins(message.member);
            const newCoins = win ? currentCoins + +args[1] : currentCoins - +args[1];

            await Utils.variables.db.update.coins.updateCoins(message.member, newCoins, 'set')

            return message.channel.send(Embed({
                title: lang.FunModule.Commands.Coinflip.Embeds.Gamble.Title,
                description: lang.FunModule.Commands.Coinflip.Embeds.Gamble[win ? 'Won' : 'Lost'].replace(/{result}/g, side + 's').replace(/{earned-lost}/g, Math.abs(currentCoins - newCoins)).replace(/{coins}/g, newCoins),
                thumbnail: Object.values(coin)[Object.keys(coin).indexOf(side)],
                footer: {
                    text: lang.FunModule.Commands.Coinflip.Embeds.Gamble.Footer.replace(/{user}/g, message.author.tag),
                    icon: message.author.displayAvatarURL({ dynamic: true })
                }
            }));
        }
    },
    description: "Flip a coin",
    usage: 'coinflip [heads/tails] [coins]',
    aliases: [
        'flipcoin'
    ]
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065