const Utils = require("../../modules/utils.js");
const { config, lang } = Utils.variables;
const Embed = Utils.Embed;

module.exports = {
  name: 'unlock',
  run: async (bot, message, args) => {

    if (config.Moderation.Logs.Enabled && !Utils.findChannel(config.Moderation.Logs.Channel, message.guild)) return message.channel.send(Embed({ preset: 'console' }));

    let isLocked = bot.lockedChannels ? bot.lockedChannels.includes(message.channel.id) : undefined;

    if (!isLocked) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Commands.Unlock.NotLocked }));

    let cachedOverwrites = bot.cachedChannelOverwrites ? bot.cachedChannelOverwrites.get(message.channel.name) : undefined;

    if (cachedOverwrites) {
      await message.channel.overwritePermissions(cachedOverwrites);
    } else {
      let overwrites = [];
      await Utils.asyncForEach(message.guild.roles.cache.array(), async (r, i) => {
        if (Object.values(config.LockUnlock.Ignore).find(i => i.toLowerCase() == r.name.toLowerCase() || i.id == r.id)) {
          let roleOverwrites = message.channel.permissionOverwrites.get(r.id)
          if (roleOverwrites) overwrites.push({ id: r.id, allow: roleOverwrites.allow, deny: roleOverwrites.deny })
        } else overwrites.push({ id: r.id, allow: 'SEND_MESSAGES' })
      });

      await message.channel.overwritePermissions(overwrites);
    }

    bot.lockedChannels.splice(bot.lockedChannels.indexOf(message.channel.name), 1)

    message.channel.send(Embed({
      color: config.EmbedColors.Error,
      title: lang.ModerationModule.Commands.Unlock.Unlocked
    }))

    if (config.Moderation.Logs.Enabled) {
      Utils.findChannel(config.Moderation.Logs.Channel, message.guild).send(Embed({
        title: lang.ModerationModule.Commands.Unlock.Log.Title,
        fields: [{ name: lang.ModerationModule.Commands.Unlock.Log.Fields[0], value: '<#' + message.channel.id + '>' }, { name: lang.ModerationModule.Commands.Unlock.Log.Fields[1], value: '<@' + message.member.id + '>' }],
        timestamp: new Date()
      }));
    }
  },
  description: "Unlock the channel you are typing in",
  usage: 'unlock',
  aliases: []
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065