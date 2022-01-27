const Discord = require("discord.js");
const Utils = require("../../modules/utils.js")
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;
const fs = require("fs");

module.exports = {
    name: 'buy',
    run: async (bot, message, args) => {
        const { config } = Utils.variables;
        if (config.Coins.Shop.Enabled == true) {
            const items = config.Coins.Shop.Items;

            if (args.length == 0) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));

            let item = items.find(item => item.Name.toLowerCase() == args.join(" ").toLowerCase());

            if (!item) return message.channel.send(Embed({ preset: 'error', description: lang.CoinModule.Commands.Buy.Errors.InvalidItem.replace(/{validitems}/g, items.map(i => i.Name).join(', ')) }));

            const userCoins = await Utils.variables.db.get.getCoins(message.member);
            const price = item.Price;

            const item_requirements = item.Required || {};
            const required = {
                level: item_requirements.Level,
                role: item_requirements.Role
            }

            const role = Utils.findRole(item.Role, message.guild);

            if (!role) return message.channel.send(Embed({ preset: 'console' }));

            if (required.level) {
                const { level } = await Utils.variables.db.get.getExperience(message.member);

                if (level < required.level) return message.channel.send(Embed({
                    preset: 'error', description: lang.CoinModule.Commands.Buy.Errors.LevelRequired
                        .replace(/{required_level}/g, required.level)
                        .replace(/{level}/g, level)
                }))
            }
            if (required.role) {
                const role = Utils.findRole(required.role, message.guild);

                if (role && !message.member.roles.cache.has(role.id)) {
                    return message.channel.send(Embed({
                        preset: 'error', description: lang.CoinModule.Commands.Buy.Errors.RoleRequired
                            .replace(/{role}/g, role.Name)
                    }))
                }
            }

            if (userCoins < price) return message.channel.send(Embed({ preset: 'error', description: lang.CoinModule.Errors.NotEnoughCoins }));

            if (message.member.roles.cache.has(role.id)) return message.channel.send(Embed({ preset: 'error', description: lang.CoinModule.Commands.Buy.Errors.AlreadyPurchased }));
            Utils.variables.db.update.coins.updateCoins(message.member, price, 'remove');
            message.member.roles.add(role.id);
            message.channel.send(Embed({ title: lang.CoinModule.Commands.Buy.Embeds.ItemPurchased.Title, description: lang.CoinModule.Commands.Buy.Embeds.ItemPurchased.Description.replace(/{item}/g, item.Name).replace(/{price}/g, item.Price.toLocaleString()), color: config.Success_Color }));
        }
    },
    description: "Purchase an item from the shop",
    usage: 'buy <item>',
    aliases: []
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065