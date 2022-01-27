const Utils = require('../modules/utils.js');
const { config, lang, embeds } = Utils.variables;

module.exports = async (bot, member) => {
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0 && require('../modules/handlers/KeyHandler.js').verified) {

        member.guild.fetchInvites().then(async invites => {
            const cached = Utils.variables.invites[member.guild.id];
            Utils.updateInviteCache(bot)

            const invite = invites.find(i => {
                if (cached.get(i.code)) {
                    return cached.get(i.code).uses < i.uses
                } else return false;
            });

            let invs = 0;

            if (invite) {
                let invitedBy = Utils.variables.invitedBy || Utils.variables.set("invitedBy", new Map())
                invitedBy.set(member.id, invite.inviter)

                invites.forEach(inv => {
                    if (inv.inviter && invite.inviter) {
                        if (inv.inviter && invite.inviter && inv.inviter.id == invite.inviter.id) invs += (inv.uses || 0);
                    }
                })
            }

            // INVITE REWARDS
            Object.keys(config.Join.InviteRewards.Roles).forEach(async invites => {
                if (invs == invites) {
                    let role = Utils.findRole(config.Join.InviteRewards.Roles[invites], member.guild);
                    if (role) {
                        member.guild.members.cache.get(invite.inviter.id).roles.add(role);
                        invite.inviter.send(lang.Other.InviteRewardsMessage.replace(/{invites}/g, invites).replace(/{role}/g, role.name)).catch(err => { });
                    }

                }
            })

            // JOIN ROLES & SAVED ROLES
            let roles = []

            if (config.Join.Roles) roles.push(...config.Join.Roles.map(roleName => Utils.findRole(roleName, member.guild)))
            if (config.Leave.Data.Roles) {
                let savedRoles = await Utils.variables.db.get.getSavedRoles(member) || [];
                roles.push(...savedRoles.map(role => Utils.findRole(role, member.guild)))
            }

            if (roles.length) member.roles.add(roles.filter(role => role))


            // JOIN MESSAGES
            if (config.Join.Messages.Enabled) {
                console.log(Utils.infoPrefix + `${member.user.tag} joined the server.`)
                if (config.Verification.Enabled && config.Verification.WelcomeMessage == "after-verified") return;

                let channel = Utils.findChannel(config.Join.Messages.Channel, member.guild);
                let embed = Utils.setupEmbed({
                    configPath: embeds.Embeds.Welcome,
                    variables: [
                        ...Utils.userVariables(member, "user"),
                        { searchFor: /{total}/g, replaceWith: member.guild.memberCount },
                        { searchFor: /{bot-pfp}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) },
                        { searchFor: /{inviter}/g, replaceWith: invite && invite.inviter ? invite.inviter.tag : "Unknown" }]
                })

                if (channel) channel.send(embed);

                if (config.Join.Messages.DM.Enabled) member.send(Utils.setupEmbed({
                    configPath: embeds.Embeds.DMWelcome,
                    variables: [
                        ...Utils.userVariables(member, "user"),
                        { searchFor: /{total}/g, replaceWith: member.guild.memberCount },
                        { searchFor: /{bot-pfp}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) },
                        { searchFor: /{inviter}/g, replaceWith: invite && invite.inviter ? invite.inviter.tag : "Unknown" }]
                })).catch(err => { })
            }
        })
    }
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065