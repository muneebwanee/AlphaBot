const Utils = require('../../modules/utils');
const lang = Utils.variables.lang;
const Embed = Utils.Embed;

module.exports = {
    name: "setexp",
    run: async (bot, message, args) => {
        let everyone = ["all", "everyone", "@everyone"].some(text => args.includes(text)) ? true : false;
        let user = Utils.ResolveUser(message, 0) || Utils.ResolveUser(message, 1);
        let amount = /<@![0-9]{18}>/.test(args[0]) || ["all", "everyone", "@everyone"].includes(args[0]) ? parseInt(args[1]) : parseInt(args[0]);

        if (args.length < 1 || !amount || (!everyone && !user)) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));
        if (!everyone && user.user.bot) return message.channel.send(Embed({ preset: "error", description: lang.ManagementModule.Commands.Setexp.SetBot }));
        if (amount < 0) return message.channel.send(Embed({ preset: "error", description: lang.ManagementModule.Commands.Setexp.SetNegative }));

        let level = 0;
        let xpNeeded = ~~((level * (175 * level) * 0.5)) - amount;

        while (xpNeeded <= 0) {
            ++level;
            xpNeeded = ~~((level * (175 * level) * 0.5)) - amount;
        }

        if (everyone) {
            await message.guild.members.cache.array().filter(m => !m.user.bot).forEach(async members => {
                await Utils.variables.db.update.experience.updateExperience(members, level, amount, 'set')
            })
        } else {
            await Utils.variables.db.update.experience.updateExperience(user, level, amount, 'set')
        }

        message.channel.send(Embed({
            title: lang.ManagementModule.Commands.Setexp.XPSet.Title,
            description: lang.ManagementModule.Commands.Setexp.XPSet.Description.replace(/{user}/g, user || lang.ManagementModule.Commands.Setexp.XPSet.Everyone).replace(/{xp}/g, amount.toLocaleString()).replace(/{level}/g, level.toLocaleString()),
            timestamp: new Date()
        }))
    },
    description: "Set the exp of all or a certain user",
    usage: "setexp <amount> <@user/all/everyone>",
    aliases: []
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065