const Discord = require("discord.js");
const Utils = require("../../modules/utils.js")
const { config, lang, commands } = Utils.variables;

module.exports = {
    name: 'eval',
    run: async (bot, message, args) => {
        if (!commands.Permissions.eval.includes(message.author.id)) return;
        message.delete()
        const code = args.join(" ");
        const embed = new Discord.MessageEmbed(Utils.Embed({
            title: "Evaluate",
            fields: [
                {
                    name: "Input",
                    value: "```js\n" + code + "```",
                    inline: true
                }
            ]
        }));
        try {
            let { res, type, name } = handle(await eval('(async () => { ' + code + ' })()'))
            embed.addField("Output", '```js\n' + res.replace(bot.token, "") + '```', true)
                .addField("Type", '```' + type + '```')
                .setColor(config.EmbedColors.Default)
            name && embed.addField("Constructor Name", '```' + name + '```', true)
        } catch (err) {
            embed.addField("Error", '```' + err + '```', true).setColor(config.EmbedColors.Error)
            if (err.name) embed.addField("Type", '```' + err.name.replace(/(.[^A-Z\s]+)([A-Z])/g, '$1 $2') + '```')
        }
        message.channel.send(embed)

        function getType(obj) {
            return ({})
                .toString.call(obj)
                .match(/\s([a-z]+)/i)[1]
        }
        function handle(res) {
            let name = res && res.constructor
            name = name ? name.name : ""
            let type = getType(res)
            if (typeof res !== "string")
                res = require('util').inspect(res, { depth: 0 });
            return {
                res: `${res}`.slice(0, 1000),
                type: type,
                name: name !== type && name
            }
        }
    },
    description: "Evalute code on the bot (dangerous)",
    usage: 'eval <code>',
    aliases: []
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065