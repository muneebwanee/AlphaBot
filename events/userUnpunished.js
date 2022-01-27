const Utils = require("../modules/utils.js");
const { config, lang } = Utils.variables;
const { capitalize } = require("lodash");

module.exports = async (bot, type, user, executor, warning = undefined) => {
    if (!config.Moderation.Logs.Enabled) return;

    let logs = Utils.findChannel(config.Moderation.Logs.Channel, executor.guild);

    if (!logs) return;

    if (type == "warn") {
        let warnedBy = executor.guild.member(warning.executor)

        logs.send(Utils.Embed({
            title: lang.ModerationModule.Logs.UserUnwarned.Title,
            fields: [
                { name: lang.ModerationModule.Logs.UserUnwarned.Fields[0], value: user },
                { name: lang.ModerationModule.Logs.UserUnwarned.Fields[1], value: executor },
                { name: lang.ModerationModule.Logs.UserUnwarned.Fields[2], value: "Warn" },
                { name: lang.ModerationModule.Logs.UserUnwarned.Fields[3], value: lang.ModerationModule.Logs.UserUnwarned.Warning.replace(/{id}/g, warning.id).replace(/{user}/g, warnedBy || "Unknown").replace(/{date}/g, (new Date(warning.time).toLocaleString())).replace(/{reason}/g, warning.reason) }
            ],
            timestamp: new Date()
        }));
    } else {
        logs.send(Utils.Embed({
            title: lang.ModerationModule.Logs.UserUnpunished.Title,
            fields: [
                { name: lang.ModerationModule.Logs.UserUnpunished.Fields[0], value: user },
                { name: lang.ModerationModule.Logs.UserUnpunished.Fields[1], value: executor },
                { name: lang.ModerationModule.Logs.UserUnpunished.Fields[2], value: capitalize(type) }
            ],
            timestamp: new Date()
        }))
    }

}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065