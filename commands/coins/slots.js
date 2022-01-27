const Discord = require("discord.js");
const Utils = require("../../modules/utils.js")
const Embed = Utils.Embed;
const bot_config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: 'slots',
    run: async (bot, message, args) => {
        const coins = await Utils.variables.db.get.getCoins(message.member);

        if (args.length == 0) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));

        const gamble = parseInt(args[0]);
        if (!gamble) return message.channel.send(Embed({ preset: 'error', description: lang.CoinModule.Commands.Slots.Errors.InvalidAmount, usage: module.exports.usage }));
        if (gamble < 10) return message.channel.send(Embed({ preset: 'error', description: lang.CoinModule.Commands.Slots.Errors.AtLeast10Coins, usage: module.exports.usage }));
        if (gamble >= 100000000) return message.channel.send(Embed({ preset: 'error', description: lang.CoinModule.Commands.Slots.Errors.GreaterThan100M }))
        if (gamble > coins) return message.channel.send(Embed({ preset: 'error', description: lang.CoinModule.Errors.NotEnoughCoins, usage: module.exports.usage }));

        const config = Utils.variables.config.Coins.Slots;
        const emojis = Object.keys(config);

        const emojiChances = {};
        emojis.forEach((emoji, i) => {
            const current = Object.values(emojiChances);
            const previousNumber = current[i - 1] || 0;
            const chance = config[emoji].Chance;
            emojiChances[emoji] = previousNumber + chance;
        })

        const emojiChanceKeys = Object.keys(emojiChances);
        const emojiChanceValues = Object.values(emojiChances);
        if (Object.values(config).map(e => e.Chance).reduce((acc, curr) => acc + curr) !== 100) {
            console.log(Utils.errorPrefix + "Slot command: All chance values must add up to 100")
            return message.channel.send(Embed({ preset: "console" }));
        }
        const final = [];
        for (let i = 0; i < 9; i++) {
            const rand = ~~(Math.random() * 100) + 1;
            const emojiPicked = emojiChanceKeys[emojiChanceValues.indexOf(emojiChanceValues.find(v => v >= rand))];
            final.push({
                emoji: emojiPicked,
                data: config[emojiPicked]
            })
        }
        let add = ~~final.map(f => f.data.Coins * gamble).reduce((acc, curr) => acc + curr);
        let multiplier = Utils.getMultiplier(message.member);
        let extra = multiplier > 1 && bot_config.Coins.Multipliers.Multiplies.Slots ? lang.CoinModule.Commands.Slots.Embed.Extra.replace(/{original}/g, add).replace(/{multiplier}/g, multiplier) : ''

        if (bot_config.Coins.Multipliers.Multiplies.Slots) add *= multiplier

        const embed = Utils.Embed({
            title: lang.CoinModule.Commands.Slots.Embed.Title,
            description: lang.CoinModule.Commands.Slots.Embed.Description.replace(/{user}/g, message.member).replace(/{recieved}/g, add.toLocaleString()).replace(/{gambled}/g, gamble.toLocaleString()).replace(/{extra}/g, extra),
            fields: [
                { name: lang.CoinModule.Commands.Slots.Embed.Fields[0], value: final.map(f => f.emoji).map((emoji, index) => emoji + ((index + 1) % 3 == 0 && index !== 0 ? '\n' : ' | ')).join(''), inline: true },
                { name: add > gamble ? lang.CoinModule.Commands.Slots.Embed.Fields[1] : lang.CoinModule.Commands.Slots.Embed.Fields[2], value: add > gamble ? lang.CoinModule.Commands.Slots.Embed.Fields[3].replace(/{amount}/g, (add - gamble).toString()) : lang.CoinModule.Commands.Slots.Embed.Fields[3].replace(/{amount}/g, (gamble - add).toString()), inline: true }
            ]
        })
        message.channel.send(embed);
        await Utils.variables.db.update.coins.updateCoins(message.member, gamble, 'remove');
        await Utils.variables.db.update.coins.updateCoins(message.member, add, 'add');

    },
    description: "Gamble a certain amount of your coins",
    usage: 'slots <coins>',
    aliases: [
        'slot',
        'gamble'
    ]
}

// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065