const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const rp = require("request-promise");
const lang = Utils.variables.lang;
const config = Utils.variables.config;

module.exports = {
    name: 'server',
    run: async (bot, message, args) => {
        if (args.length < 1) return message.channel.send(Embed({ preset: "invalidargs", usage: module.exports.usage }));
        await rp("https://api.minetools.eu/ping/" + args[0].replace(":", '/')).then((html) => {
            let json = JSON.parse(html);

            if (json.error) return message.channel.send(Embed({
                preset: 'error',
                description: lang.MinecraftModule.Commands.Server.Errors.ErrorOccured
            }))

            message.channel.send(Embed({
                title: lang.MinecraftModule.Commands.Server.Server.Title.replace(/{server-ip}/g, args[0]),
                fields: [
                    { name: lang.MinecraftModule.Commands.Server.Server.Fields[0], value: json.description.replace(/§[a-z0-9]/g, "") },
                    { name: lang.MinecraftModule.Commands.Server.Server.Fields[1].name, value: lang.MinecraftModule.Commands.Server.Server.Fields[1].value.replace(/{online}/g, json.players.online).replace(/{max}/g, json.players.max) },
                    { name: lang.MinecraftModule.Commands.Server.Server.Fields[2], value: json.version.name }
                ],
                footer: { text: lang.MinecraftModule.Commands.Server.Server.Footer, icon: lang.MinecraftModule.Commands.Server.Server.FooterIcon },
                thumbnail: "https://api.minetools.eu/favicon/" + args[0].replace(":", "/")
            }))
        })
    },
    description: "View minecraft server information",
    usage: 'server <ip>',
    aliases: ["mcserver"]
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065