const Utils = require('../../modules/utils');
const lang = Utils.variables.lang;
const Embed = Utils.Embed;

module.exports = {
    name: "takecoins",
    run: async (bot, message, args) => {
        let everyone = ["all", "everyone", "@everyone"].some(text => args.includes(text)) ? true : false;
        let user = Utils.ResolveUser(message, 0) || Utils.ResolveUser(message, 1);
        let amount = /<@![0-9]{18}>/.test(args[0]) || ["all", "everyone", "@everyone"].includes(args[0]) ? parseInt(args[1]) : parseInt(args[0]);

        if (args.length < 1 || !amount || (!everyone && !user)) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));
        if (!everyone && user.user.bot) return message.channel.send(Embed({ preset: "error", description: lang.AdminModule.Commands.Takecoins.TakeFromBot }));
        if (amount < 1) return message.channel.send(Embed({ preset: "error", description: lang.AdminModule.Commands.Takecoins.TakeNegative }));

        if (everyone) {
            await message.guild.members.cache.array().filter(m => !m.user.bot).forEach(async member => {
                await Utils.variables.db.update.coins.updateCoins(member, amount, 'remove');
            })
        } else {
            await Utils.variables.db.update.coins.updateCoins(user, amount, 'remove')
        }

        message.channel.send(Embed({
            title: lang.AdminModule.Commands.Takecoins.CoinsRemoved.Title,
            description: lang.AdminModule.Commands.Takecoins.CoinsRemoved.Description.replace(/{amount}/g, amount.toLocaleString()).replace(/{user}/g, user || lang.AdminModule.Commands.Takecoins.CoinsRemoved.Everyone),
            timestamp: new Date()
        }))
    },
    description: "Take coins from all or a certain user",
    usage: "takecoins <amount> <@user/all/everyone>",
    aliases: ['removecoins']
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065