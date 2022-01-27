const Utils = require('../../modules/utils');
const lang = Utils.variables.lang;
const Embed = Utils.Embed;

module.exports = {
    name: "setlevel",
    run: async (bot, message, args) => {
        let everyone = ["all", "everyone", "@everyone"].some(text => args.includes(text)) ? true : false;
        let user = Utils.ResolveUser(message, 0) || Utils.ResolveUser(message, 1);
        let amount = /<@![0-9]{18}>/.test(args[0]) || ["all", "everyone", "@everyone"].includes(args[0]) ? parseInt(args[1]) : parseInt(args[0]);

        if (args.length < 1 || !amount || (!everyone && !user)) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));
        if (!everyone && user.user.bot) return message.channel.send(Embed({ preset: "error", description: lang.ManagementModule.Commands.Setlevel.SetBot }));
        if (amount < 0) return message.channel.send(Embed({ preset: "error", description: lang.ManagementModule.Commands.Setlevel.SetNegative }));

        let xp = ~~(((amount - 1) * (175 * (amount - 1)) * 0.5));

        if (everyone) {
            await message.guild.members.cache.array().filter(m => !m.user.bot).forEach(async members => {
                await Utils.variables.db.update.experience.updateExperience(members, amount, xp, 'set')
            })
        } else {
            await Utils.variables.db.update.experience.updateExperience(user, amount, xp, 'set')
        }

        message.channel.send(Embed({
            title: lang.ManagementModule.Commands.Setlevel.LevelSet.Title,
            description: lang.ManagementModule.Commands.Setlevel.LevelSet.Description.replace(/{user}/g, user || lang.ManagementModule.Commands.Setlevel.LevelSet.Everyone).replace(/{level}/g, amount.toLocaleString()).replace(/{xp}/g, xp.toLocaleString()),
            timestamp: new Date()
        }))
    },
    description: "Set the level of all or a certain user",
    usage: "setlevel <amount> <@user/all/everyone>",
    aliases: []
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065