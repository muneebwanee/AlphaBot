const Discord = require("discord.js");
const Utils = require("../../modules/utils.js")
const Embed = Utils.Embed;
const { config, lang } = Utils.variables;

module.exports = {
  name: 'level',
  run: async (bot, message, args) => {
    const member = Utils.ResolveUser(message);

    if (member) {
      const xp = await Utils.variables.db.get.getExperience(member);

      const xpNeeded = ~~((xp.level * (175 * xp.level) * 0.5)) - xp.xp;

      message.channel.send(Embed({
        author: {
          icon: member.user.displayAvatarURL({ dynamic: true }),
          text: member.user.username
        },
        title: lang.XPModule.Commands.Level.Title.User.replace(/{username}/g, member.user.username),
        //thumbnail: lang.XPModule.Commands.Level.Thumbnail,
        fields: [{ name: lang.XPModule.Commands.Level.Fields[0], value: xp.level, inline: true }, { name: lang.XPModule.Commands.Level.Fields[1], value: xp.xp, inline: true }],
        footer: { text: lang.XPModule.Commands.Level.Footer.replace(/{xpneeded}/g, xpNeeded) },
        timestamp: new Date()
      }));
    } else {
      const xp = await Utils.variables.db.get.getExperience(message.member);

      const xpNeeded = ~~((xp.level * (175 * xp.level) * 0.5)) - xp.xp;

      message.channel.send(Embed({
        author: {
          icon: message.author.displayAvatarURL({ dynamic: true }),
          text: message.author.username
        },
        title: lang.XPModule.Commands.Level.Title.Self,
        fields: [{ name: lang.XPModule.Commands.Level.Fields[0], value: xp.level.toLocaleString(), inline: true }, { name: lang.XPModule.Commands.Level.Fields[1], value: xp.xp.toLocaleString(), inline: true }],
        footer: { text: lang.XPModule.Commands.Level.Footer.replace(/{xpneeded}/g, xpNeeded.toLocaleString()) },
        timestamp: new Date()
      }));
    }
  },
  description: "Check your current level",
  usage: 'level',
  aliases: [
    'explevel',
    'xplevel',
    'xp',
    'exp',
    'experience'
  ]
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065