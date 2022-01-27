const Utils = require('../../modules/utils');
const lang = Utils.variables.lang;
const Embed = Utils.Embed;
module.exports = {
    name: "givexp",
    run: async (bot, message, args) => {
        let everyone = ["all", "everyone", "@everyone"].some(text => args.includes(text)) ? true : false;
        let user = Utils.ResolveUser(message, 0) || Utils.ResolveUser(message, 1);
        let amount = /<@![0-9]{18}>/.test(args[0]) || ["all", "everyone", "@everyone"].includes(args[0]) ? parseInt(args[1]) : parseInt(args[0]);

        if (args.length < 1 || !amount || (!everyone && !user)) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));
        if (!everyone && user.user.bot) return message.channel.send(Embed({ preset: "error", description: lang.AdminModule.Commands.Givecoins.GiveToBot }));
        
        if (everyone) {
            await message.guild.members.cache.array().filter(m => !m.user.bot).forEach(async member => {
                await Utils.variables.db.update.experience.updateExperience(member, (await Utils.variables.db.get.getExperience(member)).level, amount, 'add')
                let { level, xp } = await Utils.variables.db.get.getExperience(member)
                let xpNeeded = ~~((level * (175 * level) * 0.5)) - xp;

                while (xpNeeded <= 0) {
                    ++level;
                    xpNeeded = ~~((level * (175 * level) * 0.5)) - xp;
                }

                await Utils.variables.db.update.experience.updateExperience(member, level, xp, 'set')
            })
        } else {
            await Utils.variables.db.update.experience.updateExperience(user, (await Utils.variables.db.get.getExperience(user)).level, amount, 'add')
    
            let { level, xp } = await Utils.variables.db.get.getExperience(user)
            let xpNeeded = ~~((level * (175 * level) * 0.5)) - xp;

            while (xpNeeded <= 0) {
                ++level;
                xpNeeded = ~~((level * (175 * level) * 0.5)) - xp;
            }

            await Utils.variables.db.update.experience.updateExperience(user, level, xp, 'set')
        }

        message.channel.send(Embed({
            title: lang.AdminModule.Commands.Givexp.XPAdded.Title,
            description: lang.AdminModule.Commands.Givexp.XPAdded.Description.replace(/{amount}/g, amount.toLocaleString()).replace(/{user}/g, user || lang.AdminModule.Commands.Givexp.XPAdded.Everyone),
            timestamp: new Date()
        }))
    },
    description: "Give XP to all or a certain user",
    usage: "givexp <amount> <@user/all/everyone>",
    aliases: [ 'giveexp', 'giveexperience', 'addxp', 'addexp']
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065