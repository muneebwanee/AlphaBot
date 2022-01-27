const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const request = require("request");
const lang = Utils.variables.lang;
const config = Utils.variables.config;

module.exports = {
    name: 'minecraftuser',
    run: async (bot, message, args) => {

        if (!args[0]) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));

        request({
            url: `https://api.mojang.com/users/profiles/minecraft/${args[0]}`,
            json: true
        }, async function (error, response, body) {
            if (error) return console.log(error)
            else {
                if (!body) return message.channel.send(Embed({ preset: 'error', description: lang.MinecraftModule.Commands.Mcuser.Errors.InvalidUsername, usage: module.exports.usage }));
                let namehistory = [];

                request({
                    url: `https://api.mojang.com/user/profiles/${body.id}/names`,
                    json: true
                }, async function (error, response, body) {
                    if (error) return message.channel.send(Embed({ preset: 'error' }));
                    else {
                        if (!body) return message.channel.send(Embed({ preset: 'error' }));
                        body.forEach(name => {
                            namehistory.push(name.name);
                        })
                    }
                })
                let msg = await message.channel.send(Embed({ title: lang.MinecraftModule.Commands.Mcuser.FetchingData }));
                setTimeout(function () {
                    msg.delete();
                    message.channel.send(Embed({
                        title: lang.MinecraftModule.Commands.Mcuser.UserInfo.Title.replace(/{user-name}/g, body.name),
                        fields: [
                            { name: lang.MinecraftModule.Commands.Mcuser.UserInfo.Fields[0], value: namehistory.reverse().join(", ") },
                            { name: lang.MinecraftModule.Commands.Mcuser.UserInfo.Fields[1], value: body.id },
                            { name: lang.MinecraftModule.Commands.Mcuser.UserInfo.Fields[2].name, value: lang.MinecraftModule.Commands.Mcuser.UserInfo.Fields[2].value.replace(/{namemc-link}/g, "https://namemc.com/profile/" + body.name) }
                        ],
                        thumbnail: lang.MinecraftModule.Commands.Mcuser.UserInfo.Image.replace(/{user-image}/g, `https://visage.surgeplay.com/bust/${body.id}`),
                        timestamp: new Date()
                    }))
                }, 1500);
            }
        })
    },
    description: "View minecraft account information",
    usage: 'minecraftuser <username>',
    aliases: ['mcuser', 'mcaccount', "namehistory"]
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065