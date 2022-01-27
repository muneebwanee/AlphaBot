const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: 'invitetop',
    run: async (bot, message, args) => {
        const guildInvites = await message.guild.fetchInvites();

        const users = [];
        let page = +args[0] || 1;
        if (guildInvites.size < 1) return message.channel.send(Embed({
            title: lang.Other.OtherCommands.Invitetop.Title.replace(/{current-page}/g, page).replace(/{max-pages}/g, 1),
            description: lang.Other.OtherCommands.Invitetop.NoInvites
        }));


        guildInvites.forEach(invite => {
            if (!invite.inviter || !message.guild.member(invite.inviter.id)) return;
            const user = users.find(u => u.id == invite.inviter.id);
            if (!user) {
                users.push({
                    id: invite.inviter.id,
                    invites: invite.uses
                })
            } else {
                user.invites += invite.uses;
            }
        })
        if (page > Math.ceil(users.length / config.Leaderboards.UsersPerPage.Invites)) page = 1;

        const topUsers = users.sort((a, b) => b.invites - a.invites).slice((page - 1) * config.Leaderboards.UsersPerPage.Invites, config.Leaderboards.UsersPerPage.Invites * page);

        message.channel.send(Embed({
            title: lang.Other.OtherCommands.Invitetop.Title.replace(/{current-page}/g, page).replace(/{max-pages}/g, Math.ceil(users.length / config.Leaderboards.UsersPerPage.Invites)).replace(/{page}/g, page),
            description: topUsers.map((u, i) => `**${i + 1}.** <@${u.id}> - **${u.invites}** invite${u.invites == 1 ? '' : 's'}`).join('\n'),
            footer: lang.Other.OtherCommands.Invitetop.Footer.replace(/{total}/g, guildInvites.map(i => i.uses).reduce((acc, curr) => acc + curr))
        }));
    },
    description: "View the invite leaderboard",
    usage: 'invitetop',
    aliases: []
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065