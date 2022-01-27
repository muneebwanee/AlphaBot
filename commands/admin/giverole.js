const Utils = require('../../modules/utils');
const lang = Utils.variables.lang;
const Embed = Utils.Embed;

module.exports = {
    name: "giverole",
    run: async (bot, message, args) => {
        let everyone = ["all", "everyone", "@everyone"].some(text => args.includes(text)) ? true : false;
        let user = Utils.ResolveUser(message, 0) || Utils.ResolveUser(message, 1);
        let role = message.mentions.roles.first()

        if (args.length < 1 || !role || (!everyone && !user)) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));
        if (!everyone && user.user.bot) return message.channel.send(Embed({ preset: "error", description: lang.AdminModule.Commands.Giverole.GiveToBot }));

        if (role.position > message.member.roles.highest.position) return message.channel.send(Embed({
            preset: 'error',
            description: lang.AdminModule.Commands.Giverole.HigherRole[0]
        }))
        if (role.position > message.guild.me.roles.highest.position) return message.channel.send(Embed({
            preset: 'error',
            description: lang.AdminModule.Commands.Giverole.HigherRole[1]
        }))
        if (everyone) {
            await Utils.asyncForEach(message.guild.members.cache.array().filter(m => !m.user.bot), async member => {
                await member.roles.add(role, `Added by ${message.author.tag} from giverole command`)
            })
        } else {
            await user.roles.add(role, `Added by ${message.author.tag} from giverole command`)
        }

        message.channel.send(Embed({
            title: lang.AdminModule.Commands.Giverole.RoleAdded.Title,
            description: lang.AdminModule.Commands.Giverole.RoleAdded.Description.replace(/{role}/g, role).replace(/{user}/g, user || lang.AdminModule.Commands.Giverole.RoleAdded.Everyone),
            timestamp: new Date()
        }))
    },
    description: "Give all or a certain user a role",
    usage: "giverole <@role> <@user/all/everyone>",
    aliases: ['addrole']
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065