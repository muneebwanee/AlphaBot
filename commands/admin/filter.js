const Utils = require("../../modules/utils.js")
const Embed = Utils.Embed;
const lang = Utils.variables.lang;

module.exports = {
    name: 'filter',
    run: async (bot, message, args) => {
        let filter = await Utils.variables.db.get.getFilter();

        if (!args[0] || args[0].toLowerCase() == 'help') return message.channel.send(Embed({
            title: lang.FilterSystem.Commands.Filter.Help.Title,
            description: lang.FilterSystem.Commands.Filter.Help.Description,
            fields: [
                { name: lang.FilterSystem.Commands.Filter.Help.Fields[0][0], value: lang.FilterSystem.Commands.Filter.Help.Fields[0][1], inline: true },
                { name: lang.FilterSystem.Commands.Filter.Help.Fields[1][0], value: lang.FilterSystem.Commands.Filter.Help.Fields[1][1], inline: true },
                { name: lang.FilterSystem.Commands.Filter.Help.Fields[2][0], value: lang.FilterSystem.Commands.Filter.Help.Fields[2][1], inline: true }
            ]
        }));

        else if (args[0].toLowerCase() == 'list') {
            message.channel.send(Embed({
                title: lang.FilterSystem.Commands.Filter.List.Title,
                timestamp: new Date(message.createdTimestamp),
                description: "**Words:**\n" + (filter.length == 0 ? lang.FilterSystem.Commands.Filter.NoWordsInFilter : filter.join("\n"))
            }))
        }

        else if (args[0].toLowerCase() == 'add') {
            if (!args[1]) return message.channel.send(Embed({ preset: 'invalidargs', usage: 'filter add <word>' }))
            if (filter.some(word => args[1].toLowerCase() == word.toLowerCase())) return message.channel.send(Embed({ preset: 'error', description: lang.FilterSystem.Commands.Filter.Add.WordAlreadyInFilter }));

            await Utils.variables.db.update.filter.addWord(args[1]);
            message.channel.send(Embed({ title: lang.FilterSystem.Commands.Filter.Add.Title, description: lang.FilterSystem.Commands.Filter.Add.Description.replace(/{word}/g, args[1]) }))
        }

        else if (args[0].toLowerCase() == "remove") {
            if (!args[1]) return message.channel.send(Embed({ preset: 'invalidargs', usage: 'filter remove <word>' }));
            if (!filter.some(word => args[1].toLowerCase() == word.toLowerCase())) return message.channel.send(Embed({ preset: 'error', description: lang.FilterSystem.Commands.Filter.Remove.InvalidWord.replace(/{words}/g, filter.join(",").length == 0 ? lang.FilterSystem.Commands.Filter.NoWordsInFilter : filter.join(",")) }))

            await Utils.variables.db.update.filter.removeWord(args[1]);
            message.channel.send(Embed({ title: lang.FilterSystem.Commands.Filter.Remove.Title, description: lang.FilterSystem.Commands.Filter.Remove.Description.replace(/{word}/g, args[1]) }));
        }
    },
    description: "Add, delete, or view the list of filtered words",
    usage: 'filter <add/delete/list> <word>',
    aliases: []
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065