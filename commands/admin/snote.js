const Utils = require('../../modules/utils');
const { config, lang } = Utils.variables;

module.exports = {
    name: "snote",
    run: async (bot, message, args, { prefixUsed, commandUsed }) => {

        message.delete().catch(err => { })

        let channels = Object.values(config.Suggestions.Channels)
        let note = message.content.substring((prefixUsed + commandUsed).length);

        if (!channels.includes(message.channel.id) && !channels.includes(message.channel.name)) return message.channel.send(Utils.Embed({ preset: "error", description: lang.AdminModule.Commands.Snote.NotSuggestionChannel })).then(m => m.delete({ timeout: 3000 }).catch(err => { }));
        if (!note.length) return message.channel.send(Utils.Embed({ preset: 'invalidargs', usage: module.exports.usage })).then(m => m.delete({ timeout: 3000 }).catch(err => { }));

        let webhook = (await message.channel.fetchWebhooks()).find(webhook => webhook.name.toLowerCase() == "suggestions");

        if (!webhook) webhook = await message.channel.createWebhook("Suggestions")

        let username = config.Suggestions.Notes.Account.Username
        let avatar = config.Suggestions.Notes.Account.Avatar
        let text = config.Suggestions.Notes.Message.Text

        Utils.userVariables(message.member, "user").forEach(variable => {
            username = username.replace(variable.searchFor, variable.replaceWith);
            avatar = avatar.replace(variable.searchFor, variable.replaceWith);
            text = text.replace(variable.searchFor, variable.replaceWith);
        })

        if (config.Suggestions.Notes.Message.Type == "text") {
            webhook.send(text.replace(/{note}/g, note), {
                username: username,
                avatarURL: avatar
            })
        } else {
            webhook.send({
                embeds: [Utils.setupEmbed({
                    configPath: config.Suggestions.Notes.Message.Embed,
                    variables: [
                        ...Utils.userVariables(message.member, "user"),
                        { searchFor: /{note}/g, replaceWith: note }
                    ]
                })],
                username: username,
                avatarURL: avatar
            })
        }
    },
    description: "Send a message in a suggestion channel",
    usage: "snote <message>",
    aliases: ['suggestionnote', 'smsg', 'suggestionmessage']
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065