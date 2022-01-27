const Utils = require('../../modules/utils');
const lang = Utils.variables.lang;
const Embed = Utils.Embed;
module.exports = {
    name: "takelevels",
    run: async (bot, message, args) => {
        let everyone = ["all", "everyone", "@everyone"].some(text => args.includes(text)) ? true : false;
        let user = Utils.ResolveUser(message, 0) || Utils.ResolveUser(message, 1);
        let amount = /<@![0-9]{18}>/.test(args[0]) || ["all", "everyone", "@everyone"].includes(args[0]) ? parseInt(args[1]) : parseInt(args[0]);

        if (args.length < 1 || !amount || (!everyone && !user)) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));
        if (!everyone && user.user.bot) return message.channel.send(Embed({ preset: "error", description: lang.AdminModule.Commands.Takelevels.TakeFromBot }));
        if (amount < 1) return message.channel.send(Embed({ preset: "error", description: lang.AdminModule.Commands.Takelevels.TakeNegative }));

        if (everyone) {
            await message.guild.members.cache.array().filter(m => !m.user.bot).forEach(async member => {
                let { level } = await Utils.variables.db.get.getExperience(user);

                level -= amount;
                let xpNeeded = ~~(((level - 1) * (175 * (level - 1)) * 0.5));
                if (level < 1) {
                    xpNeeded = 0;
                    level = 1;
                }

                await Utils.variables.db.update.experience.updateExperience(member, level, xpNeeded, 'set')
            })
        } else {
            let { level } = await Utils.variables.db.get.getExperience(user);

            level -= amount;
            let xpNeeded = ~~(((level - 1) * (175 * (level - 1)) * 0.5));
            if (level < 1) {
                xpNeeded = 0;
                level = 1;
            }

            await Utils.variables.db.update.experience.updateExperience(user, level, xpNeeded, 'set')
        }

        message.channel.send(Embed({
            title: lang.AdminModule.Commands.Takelevels.LevelsRemoved.Title,
            description: lang.AdminModule.Commands.Takelevels.LevelsRemoved.Description.replace(/{amount}/g, amount.toLocaleString()).replace(/{user}/g, user || lang.AdminModule.Commands.Takelevels.LevelsRemoved.Everyone),
            timestamp: new Date()
        }))
    },
    description: "Take levels from all or a certain user",
    usage: "takelevels <amount> <@user/all/everyone>",
    aliases: ['takelevel', 'removelevel', 'removelevels']
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065