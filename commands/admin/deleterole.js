const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: 'deleterole',
    run: async (bot, message, args) => {
        let toDelete = message.mentions.roles.first() || message.guild.roles.cache.find(r => r.name == args.join(" ").toLowerCase() || r.id == args[0]);

        if (!toDelete) return message.channel.send(Embed({ preset: 'error', description: lang.AdminModule.Commands.Deleterole.Errors.InvalidRole, usage: module.exports.usage }));

        let msg = await message.channel.send(Embed({ title: lang.AdminModule.Commands.Deleterole.Confirmation }));
        await msg.react('✅');
        await msg.react('❌');
        Utils.waitForReaction(['✅', '❌'], message.author.id, msg).then(reaction => {
            msg.delete();
            return (reaction.emoji.name == '✅') ? message.channel.send(Embed({ title: lang.AdminModule.Commands.Deleterole.Deleted, color: config.EmbedColors.Default })).then(async msg => await toDelete.delete()) : message.channel.send(Embed({ title: lang.AdminModule.Commands.Deleterole.Canceled, color: config.EmbedColors.Error }));
        })

    },
    description: "Delete a role on the Discord server",
    usage: 'deleterole <@role>',
    aliases: []
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065