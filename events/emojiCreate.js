const Utils = require('../modules/utils');
const { config, lang } = Utils.variables;

module.exports = async (bot, emoji) => {
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0 && require('../modules/handlers/KeyHandler.js').verified) {
        if (!Utils.variables.config.Logs.Enabled.includes("EmojiCreated")) return;
        
        const logs = Utils.findChannel(Utils.variables.config.Logs.Channels.EmojiCreated, emoji.guild);
        
        logs.send(Utils.Embed({
            title: lang.LogSystem.EmojiCreated.Title,
            fields: [
                {
                    name: lang.LogSystem.EmojiCreated.Fields[0],
                    value: emoji.name
                }, {
                    name: lang.LogSystem.EmojiCreated.Fields[1],
                    value: emoji.id
                }, {
                    name: lang.LogSystem.EmojiCreated.Fields[2],
                    value: emoji.animated ? "Yes" : "No"
                }, {
                    name: lang.LogSystem.EmojiCreated.Fields[3],
                    value: `<:${emoji.name}:${emoji.id}>`
                }
            ],
            timestamp: Date.now()
        }))
    }
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065