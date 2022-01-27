const Utils = require('../modules/utils.js');

module.exports = async (bot, member) => {
    const { config, embeds } = Utils.variables;
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0 && require('../modules/handlers/KeyHandler.js').verified) {

        if (config.Leave.Messages.Enabled) {
            console.log(Utils.infoPrefix + `${member.user.tag} left the server.`);
            const channel = Utils.findChannel(config.Leave.Messages.Channel, member.guild);

            if (channel) channel.send(Utils.setupEmbed({
                configPath: embeds.Embeds.Leave,
                variables: [
                    ...Utils.userVariables(member, "user"),
                    { searchFor: /{total}/g, replaceWith: member.guild.memberCount },
                    { searchFor: /{bot-pfp}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) }]
            }));
        }

        if (!config.Leave.Data.Coins) {
            Utils.variables.db.update.coins.updateCoins(member, 0, 'set');
        }

        if (!config.Leave.Data.Levels) {
            Utils.variables.db.update.experience.updateExperience(member, 1, 0, 'set');
        }

        if (!config.Leave.Data.Punishments) {
            let punishments = await Utils.variables.db.get.getPunishmentsForUser(member.id);
            punishments.forEach(async punishment => {
                await Utils.variables.db.update.punishments.removePunishment(punishment.id);
            })

            let warnings = await Utils.variables.db.get.getWarnings(member);
            warnings.forEach(async warning => {
                await Utils.variables.db.update.punishments.removeWarning(warning.id)
            })
        }

        if (config.Leave.Data.Roles && member.roles.cache.size) {
            await Utils.variables.db.update.roles.setSavedRoles(member, JSON.stringify(member.roles.cache.filter(r => r.name !== "@everyone").map(r => r.id)))
        }
    }
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065