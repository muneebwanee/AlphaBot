const Discord = require("discord.js");
const Utils = require("../../modules/utils.js")
const Embed = Utils.Embed;
const { config, lang, commands } = Utils.variables;

module.exports = {
  name: 'ban',
  run: async (bot, message, args) => {
    const user = Utils.ResolveUser(message);
    const reason = args.slice(1).join(" ");

    if (config.Moderation.Logs.Enabled && !Utils.findChannel(config.Moderation.Logs.Channel, message.guild)) return message.channel.send(Embed({ preset: 'console' }));
    if (args.length < 2 || !reason) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }))
    if (!user) return message.channel.send(Embed({ preset: 'error', description: lang.GlobalErrors.InvalidUser, usage: module.exports.usage }))
    if (config.Moderation.AreStaffPunishable) {
      if (user.roles.highest.position >= message.member.roles.highest.position) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Errors.CantPunishStaffHigher }))
    } else {
      if (Utils.hasPermission(user, commands.Permissions.ban)) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Errors.CantPunishStaff }))
    }
    if (user.user.bot == true || user.id == message.author.id) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Errors.CantPunishUser }));
    if (message.guild.me.roles.highest.position <= user.roles.highest.position) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Errors.BotCantPunishUser }))

    user.ban({ reason: reason });

    let punishment = {
      type: module.exports.name,
      user: user.id,
      tag: user.user.tag,
      reason: reason,
      time: message.createdAt.getTime(),
      executor: message.author.id
    }

    await Utils.variables.db.update.punishments.addPunishment(punishment)
    bot.emit('userPunished', punishment, user, message.member)

    message.channel.send(Utils.setupEmbed({
      configPath: {},
      title: lang.ModerationModule.Commands.Ban.Title,
      description: lang.ModerationModule.Commands.Ban.Description,
      color: config.EmbedColors.Success,
      variables: [
        ...Utils.userVariables(user, "user"),
        ...Utils.userVariables(message.member, "executor"),
        { searchFor: /{reason}/g, replaceWith: reason }
      ]
    }))
  },
  description: "Ban a member of the server.",
  usage: 'ban <@user> <reason>',
  aliases: []
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065