const Utils = require("../../modules/utils.js");
const { config, lang, commands } = Utils.variables;
const Embed = Utils.Embed;

module.exports = {
  name: 'unmute',
  run: async (bot, message, args) => {
    let user = Utils.ResolveUser(message)
    let muteRole = Utils.findRole(config.Moderation.MuteRole, message.guild);

    if (config.Moderation.Logs.Enabled && !Utils.findChannel(config.Moderation.Logs.Channel, message.guild)) return message.channel.send(Embed({ preset: 'console' }));
    if (!muteRole) return message.channel.send(Embed({ preset: 'console' }));
    if (!args[0]) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }))
    if (!user) return message.channel.send(Embed({ preset: 'error', description: lang.GlobalErrors.InvalidUser, usage: module.exports.usage }))
    if (config.Moderation.AreStaffPunishable) {
      if (user.roles.highest.position >= message.member.roles.highest.position) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Errors.CantPunishStaffHigher }))
    } else {
      if (Utils.hasPermission(user, commands.Permissions.unmute)) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Errors.CantPunishStaff }))
    }
    if (user.user.bot == true || user.id == message.author.id) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Errors.CantPunishUser }));
    if (message.guild.me.roles.highest.position <= user.roles.highest.positon) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Errors.BotCantPunishUser }))
    if (!user.roles.cache.get(muteRole.id)) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Commands.Unmute.Errors.UserNotMuted }));

    user.roles.remove(muteRole.id);
    message.channel.send(Utils.setupEmbed({
      configPath: {},
      title: lang.ModerationModule.Commands.Unmute.Embeds.Unmuted.Title,
      description: lang.ModerationModule.Commands.Unmute.Embeds.Unmuted.Description,
      color: config.EmbedColors.Success,
      variables: [
        ...Utils.userVariables(user, "user"),
        ...Utils.userVariables(message.member, "executor")
      ]
    }))

    bot.emit('userUnpunished', module.exports.name, user, message.member)
  },
  description: "Unmute a user on the Discord server",
  usage: 'unmute <@user>',
  aliases: []
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065