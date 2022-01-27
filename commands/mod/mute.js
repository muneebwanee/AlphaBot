const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const { config, lang, commands } = Utils.variables;

module.exports = {
  name: 'mute',
  run: async (bot, message, args) => {
    let user = Utils.ResolveUser(message)
    let reason = args.slice(1).join(" ")
    let muteRole = Utils.findRole(config.Moderation.MuteRole, message.guild);

    if (config.Moderation.Logs.Enabled && !Utils.findChannel(config.Moderation.Logs.Channel, message.guild)) return message.channel.send(Embed({ preset: 'console' }));
    if (!muteRole) return message.channel.send(Embed({ preset: 'console' }));
    if (args.length < 2 || !reason) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }))
    if (!user) return message.channel.send(Embed({ preset: 'error', description: lang.GlobalErrors.InvalidUser, usage: module.exports.usage }))
    if (user.roles.cache.get(muteRole.id)) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Errors.UserAlreadyPunished }));
    if (config.Moderation.AreStaffPunishable) {
      if (user.roles.highest.position >= message.member.roles.highest.position) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Errors.CantPunishStaffHigher }))
    } else {
      if (Utils.hasPermission(user, commands.Permissions.mute)) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Errors.CantPunishStaff }))
    }
    if (user.user.bot == true || user.id == message.author.id) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Errors.CantPunishUser }));
    if (message.guild.me.roles.highest.position <= user.roles.highest.position) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Errors.BotCantPunishUser }))

    user.roles.add(muteRole.id);

    let punishment = {
      type: module.exports.name,
      user: user.id,
      tag: user.user.tag,
      reason: reason,
      time: message.createdAt.getTime(),
      executor: message.author.id
    }

    await Utils.variables.db.update.punishments.addPunishment(punishment)
    bot.emit('userPunished', punishment, user, message.member);

    message.channel.send(Utils.setupEmbed({
      configPath: {},
      title: lang.ModerationModule.Commands.Mute.Title,
      description: lang.ModerationModule.Commands.Mute.Description,
      color: config.EmbedColors.Success,
      variables: [
        ...Utils.userVariables(user, "user"),
        ...Utils.userVariables(message.member, "executor"),
        { searchFor: /{reason}/g, replaceWith: reason }
      ]
    }))
  },
  description: "Mute a user in the Discord server",
  usage: 'mute <@user> <reason>',
  aliases: []
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065