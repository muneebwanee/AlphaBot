const Utils = require('../modules/utils.js');
const Embed = Utils.Embed;
const { lang, config } = Utils.variables;

Array.prototype.diff = function (a) {
    return this.filter(function (i) { return a.indexOf(i) < 0; });
};

module.exports = async (bot, oldmember, newmember) => {
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0 && require('../modules/handlers/KeyHandler.js').verified) {
        if (!config.Logs.Enabled.includes("GuildMemberUpdated")) return;

        const logs = Utils.findChannel(config.Logs.Channels.GuildMemberUpdated, newmember.guild);
        if (!logs) return;

        const oldroles = oldmember.roles.cache.keyArray();
        const newroles = newmember.roles.cache.keyArray();

        if (oldroles !== newroles) {
            const removedRoles = oldroles.diff(newroles);
            const addedRoles = newroles.diff(oldroles);

            if (removedRoles.length > 0 && !!logs) {
                const role = Utils.findRole(removedRoles[0], oldmember.guild);
                logs.send(Embed({
                    title: lang.LogSystem.UserRolesUpdated.RoleRemoved.Title,
                    fields: [
                        {
                            name: lang.LogSystem.UserRolesUpdated.RoleRemoved.Fields[0],
                            value: `<@${newmember.id}>`
                        },
                        {
                            name: lang.LogSystem.UserRolesUpdated.RoleRemoved.Fields[1],
                            value: `<@&${role.id}>`
                        }
                    ],
                    timestamp: Date.now()
                }))
            } else if (addedRoles.length > 0 && !!logs) {
                const role = Utils.findRole(addedRoles[0], oldmember.guild);
                logs.send(Embed({
                    title: lang.LogSystem.UserRolesUpdated.RoleAdded.Title,
                    fields: [
                        {
                            name: lang.LogSystem.UserRolesUpdated.RoleAdded.Fields[0],
                            value: `<@${newmember.id}>`
                        },
                        {
                            name: lang.LogSystem.UserRolesUpdated.RoleAdded.Fields[1],
                            value: `<@&${role.id}>`
                        }
                    ],
                    timestamp: Date.now()
                }))
            }
        }

        const oldnick = oldmember.displayName;
        const newnick = newmember.displayName;

        if (oldnick !== newnick) {
            logs.send(Embed({
                title: lang.LogSystem.DisplaynameUpdated.Title,
                fields: [
                    {
                        name: lang.LogSystem.DisplaynameUpdated.Fields[0],
                        value: `<@${newmember.id}> (${newmember.user.tag})`
                    },
                    {
                        name: lang.LogSystem.DisplaynameUpdated.Fields[1],
                        value: oldnick
                    },
                    {
                        name: lang.LogSystem.DisplaynameUpdated.Fields[2],
                        value: newnick
                    }
                ]
            }))
        }
    }
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065