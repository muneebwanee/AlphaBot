const Utils = require("../../modules/utils.js");
const lang = Utils.variables.lang;
const config = Utils.variables.config;
const Embed = Utils.Embed;

module.exports = {
    name: 'unban',
    run: async (bot, message, args) => {
        if (config.Moderation.Logs.Enabled && !Utils.findChannel(config.Moderation.Logs.Channel, message.guild)) return message.channel.send(Embed({ preset: 'console' }));
        if (args.length == 0) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));

        let bans = await message.guild.fetchBans();
        let userTag = message.content.replace(`${await Utils.variables.db.get.getPrefixes(message.guild.id)}unban `, '').replace('@', '').split('#');
        let userID = message.content.replace(`${await Utils.variables.db.get.getPrefixes(message.guild.id)}unban `, '').replace('<', '').replace('>', '').replace('@', '').replace('!', '');
        let user = bans.find(ban => ban.user.id == userID || ban.user.username == userTag[0].replace("'", "\'") || (ban.user.username == userTag[0] && ban.user.discriminator == userTag[1]));

        if (user) {
            await message.guild.members.unban(user.user.id)
            message.channel.send(Utils.setupEmbed({
                configPath: {},
                title: lang.ModerationModule.Commands.Unban.Embeds.Unbanned.Title,
                description: lang.ModerationModule.Commands.Unban.Embeds.Unbanned.Description,
                color: config.EmbedColors.Success,
                variables: [
                    ...Utils.userVariables(message.member, "executor"),
                    { searchFor: /{user-id}/g, replaceWith: user.user.id },
                    { searchFor: /{user-username}/g, replaceWith: user.user.username },
                    { searchFor: /{user-tag}/g, replaceWith: user.user.tag },
                    { searchFor: /{user-mention}/g, replaceWith: '<@' + user.user.id + '>' },
                    { searchFor: /{user-pfp}/g, replaceWith: user.user.displayAvatarURL({ dynamic: true }) },
                ]
            }))

            bot.emit('userUnpunished', module.exports.name, user.user, message.member)
        } else message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Commands.Unban.Errors.UserNotBanned }));
    },
    description: "Unban a user on the Discord server",
    usage: 'unban <user ID/user tag>',
    aliases: []
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065