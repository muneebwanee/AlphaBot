const Discord = require("discord.js");
const Utils = require("../../modules/utils.js")
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;
const rp = require("request-promise");

module.exports = {
    name: 'status',
    run: async (bot, message, args) => {
        const servers = Object.keys(config.Servers).map(serverName => {
            const server = config.Servers[serverName];
            return { name: serverName, queryURL: server.QueryURL, pingURL: server.PingURL }
        })
        let msg = await message.channel.send(Embed({ title: lang.MinecraftModule.Commands.Status.LoadingStatus }));
        if (args.length >= 1) {

            let players;
            let total;
            let requiredVersion;
            let max;

            const server = servers.find(s => s.name.toLowerCase() == args.join(" ").toLowerCase());
            if (!server) return message.channel.send(Embed({ preset: 'error', description: lang.MinecraftModule.Commands.Status.Errors.InvalidServer }));

            await rp(server.pingURL).then((html) => {
                let json = JSON.parse(html);

                if (json.error) {
                    max = "Error";
                    total = "Error";
                } else {
                    max = json.players.max;
                    total = json.players.online
                    requiredVersion = json.version.name
                }
            })
            await rp(server.queryURL).then((html) => {
                let json = JSON.parse(html);
                if (json.error) {
                    players = lang.MinecraftModule.Commands.Status.Errors.CouldntFetchList;
                    if (!requiredVersion) requiredVersion = lang.MinecraftModule.Commands.Status.Errors.CouldntFetchVersion
                }
                else {
                    if (!json.Playerlist) players = lang.MinecraftModule.Commands.Status.Errors.CouldntFetchList
                    else {
                        if (json.Playerlist.length == 0) return players = "None";
                        else {
                            players = json.Playerlist.join(", ")
                        }
                    }
                    if (!json.Version) requiredVersion = lang.MinecraftModule.Commands.Status.Errors.CouldntFetchVersion
                    else requiredVersion = json.Version;
                }
            })

            let embed = new Discord.MessageEmbed()
                .setColor(config.EmbedColors.Default)
                .setTitle(lang.MinecraftModule.Commands.Status.Embeds.SpecificStatus.Title.replace(/{server}/g, server.name))
                .addField(lang.MinecraftModule.Commands.Status.Embeds.SpecificStatus.Fields[0], total + '/' + max)
                .addField(lang.MinecraftModule.Commands.Status.Embeds.SpecificStatus.Fields[1], players)
                .addField(lang.MinecraftModule.Commands.Status.Embeds.SpecificStatus.Fields[2], requiredVersion)

            await msg.edit(embed);
        } else {
            let fields = []

            for (let i = 0; i < servers.length; i++) {
                await rp(servers[i].pingURL).then(content => {
                    const json = JSON.parse(content);
                    if (json.error) fields.push({ 
                        name: lang.MinecraftModule.Commands.Status.Embeds.GlobalStatus.Offline[0].replace(/{server}/g, servers[i].name), 
                        value: lang.MinecraftModule.Commands.Status.Embeds.GlobalStatus.Offline[1].replace(/{server}/g, servers[i].name)
                    })
                    else {
                        const playerCount = json.players.online;
                        fields.push({
                            name: lang.MinecraftModule.Commands.Status.Embeds.GlobalStatus.Online[0].replace(/{server}/g, servers[i].name).replace(/{playercount}/g, playerCount),
                            value: lang.MinecraftModule.Commands.Status.Embeds.GlobalStatus.Online[1].replace(/{server}/g, servers[i].name).replace(/{playercount}/g, playerCount)
                        })
                    }
                })
            }

            let embed = Embed({
                title: lang.MinecraftModule.Commands.Status.Embeds.GlobalStatus.Title,
                fields: fields
            })

            msg.edit(embed);
        }
    },
    description: "View a Minecraft server's status",
    usage: 'status [server]',
    aliases: [
        'serverstatus'
    ]
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065