const Utils = require('../modules/utils');
const { config, lang } = Utils.variables;

module.exports = async (bot, oldRole, newRole) => {
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0 && require('../modules/handlers/KeyHandler.js').verified) {
        if (Utils.variables.config.Logs.Enabled.includes("RoleUpdated")) {
            let logs = Utils.findChannel(Utils.variables.config.Logs.Channels.RoleUpdated, newRole.guild);

            let embed = Utils.Embed({
                title: lang.LogSystem.RoleUpdated.Title,
                fields: [
                    {
                        name: lang.LogSystem.RoleUpdated.Fields[0],
                        value: newRole
                    }
                ]
            })

            if (oldRole.name !== newRole.name) {
                embed.embed.fields.push({
                    name: lang.LogSystem.RoleUpdated.Fields[1],
                    value: `${lang.LogSystem.RoleUpdated.Previously}${oldRole.name}\n${lang.LogSystem.RoleUpdated.Currently}${newRole.name}`
                })
            }

            if (oldRole.color !== newRole.color) {
                embed.embed.fields.push({
                    name: lang.LogSystem.RoleUpdated.Fields[2],
                    value: `${lang.LogSystem.RoleUpdated.Previously}${oldRole.hexColor}\n${lang.LogSystem.RoleUpdated.Currently}${newRole.hexColor}`
                })
            }

            if (oldRole.hoist !== newRole.hoist) {
                let oldH = oldRole.hoist ? lang.LogSystem.RoleUpdated.Hoisted : lang.LogSystem.RoleUpdated.NotHoisted
                let newH = newRole.hoist ? lang.LogSystem.RoleUpdated.Hoisted : lang.LogSystem.RoleUpdated.NotHoisted
                embed.embed.fields.push({
                    name: lang.LogSystem.RoleUpdated.Fields[3],
                    value: `${lang.LogSystem.RoleUpdated.Previously}${oldH}\n${lang.LogSystem.RoleUpdated.Currently}${newH}`
                })
            }

            if (oldRole.mentionable !== newRole.mentionable) {
                let oldM = oldRole.mentionable ? lang.LogSystem.RoleUpdated.Mentionable : lang.LogSystem.RoleUpdated.NotMentionable
                let newM = newRole.mentionable ? lang.LogSystem.RoleUpdated.Mentionable : lang.LogSystem.RoleUpdated.NotMentionable
                embed.embed.fields.push({
                    name: lang.LogSystem.RoleUpdated.Fields[4],
                    value: `${lang.LogSystem.RoleUpdated.Previously}${oldM}\n${lang.LogSystem.RoleUpdated.Currently}${newM}`
                })
            }

            if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
                embed.embed.fields.push({
                    name: lang.LogSystem.RoleUpdated.Fields[5],
                    value: `${lang.LogSystem.RoleUpdated.Previously}${oldRole.permissions.toArray().map(perm => '`' + perm.toLowerCase() + '`').join(", ")}\n${lang.LogSystem.RoleUpdated.Currently}${newRole.permissions.toArray().map(perm => '`' + perm.toLowerCase() + '`').join(", ")}`
                })
            }

            if (embed.embed.fields.length == 1) return;

            if (logs) logs.send(embed)
        }
    }
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065