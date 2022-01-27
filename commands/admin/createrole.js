const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const Discord = Utils.Discord;
const lang = Utils.variables.lang;

module.exports = {
    name: 'createrole',
    run: async (bot, message, args) => {
        let name; lang.AdminModule.Commands.Createrole.Errors
        let color;
        let permissions;

        let msg = await message.channel.send(Embed({ title: lang.AdminModule.Commands.Createrole.Embeds.RoleSetup.Title.replace(/{pos}/g, '1/3'), description: lang.AdminModule.Commands.Createrole.Embeds.RoleSetup.Questions[0] }));
        await Utils.waitForResponse(message.author.id, message.channel).then(async response => {
            name = response.content;
            await response.delete();
        })

        msg.edit(Embed({ title: lang.AdminModule.Commands.Createrole.Embeds.RoleSetup.Title.replace(/{pos}/g, '2/3'), description: lang.AdminModule.Commands.Createrole.Embeds.RoleSetup.Questions[1] }));
        let hex = false;
        while (!hex) {
            await Utils.waitForResponse(message.author.id, message.channel).then(async response => {
                await response.delete();
                if (!/#([a-f]|[0-9]){6}/.test(response.content)) return message.channel.send(Embed({ preset: 'error', description: lang.AdminModule.Commands.Createrole.Errors.InvalidHex })).then(m => m.delete({ timeout: 2500 }));
                color = response.content;
                hex = true;
            });
        }

        msg.edit(Embed({ title: lang.AdminModule.Commands.Createrole.Embeds.RoleSetup.Title.replace(/{pos}/g, '3/3'), description: lang.AdminModule.Commands.Createrole.Embeds.RoleSetup.Questions[2] }));
        let n = false;
        while (!n) {
            await Utils.waitForResponse(message.author.id, message.channel).then(async response => {
                await response.delete();
                if (parseInt(response.content) == NaN) return message.channel.send(Embed({ preset: 'error', description: lang.AdminModule.Commands.Createrole.Errors.InvalidNumber })).then(m => m.delete({ timeout: 2500 }));
                permissions = parseInt(response.content);
                n = true;
            })
        }
        await message.guild.roles.create({
            data: {
                name: name,
                color: color,
                permissions: permissions
            }
        }, `Role created by: ${message.author.tag}`).then(r => {
            msg.edit(Embed({ title: lang.AdminModule.Commands.Createrole.Embeds.RoleCreated.Title, color: color, description: lang.AdminModule.Commands.Createrole.Embeds.RoleCreated.Description.replace(/{role}/g, r).replace(/{permissions}/g, new Discord.Permissions(r.permissions).toArray().join(", ").toLowerCase()) }))
        })
    },
    description: "Create a role on the Discord server",
    usage: 'createrole',
    aliases: []
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065