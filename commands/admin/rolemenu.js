const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: 'rolemenu',
    run: async (bot, message, args) => {
        if (args.length == 0) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));
        let menu = config.ReactionRoles.find(menu => menu.Name.toLowerCase() == args.join(" ").toLowerCase())
        if (!menu) return message.channel.send(Embed({ title: lang.AdminModule.Commands.Rolemenu.Embeds.InvalidMenu.Title, description: lang.AdminModule.Commands.Rolemenu.Embeds.InvalidMenu.Description, color: config.EmbedColors.Error }));

        let emojiroles = Object.keys(menu.EmojisToRoles).map((emoji, i) => {
            let e = bot.emojis.cache.find(em => em.id == emoji || em.toString() == emoji)
            if (e) return `${e.toString()} **${menu.EmojisToRoles[emoji]}**`
            else return `${emoji} **${menu.EmojisToRoles[emoji]}**`
        }).join('\n')

        message.channel.send(Utils.setupEmbed({
            configPath: menu.Embed,
            variables: [
                { searchFor: /{emojiroles}/g, replaceWith: emojiroles }
            ]
        })).then(async msg => {
            Object.keys(menu.EmojisToRoles).forEach(async emoji => {
                let e = bot.emojis.cache.find(em => em.id == emoji || em.toString() == emoji)
                await msg.react(e || emoji)
            })
        });
    },
    description: "Send the reaction role menu",
    usage: 'rolemenu <menu>',
    aliases: []
}

// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065