const Discord = require("discord.js");
const Utils = require("../../modules/utils.js")
const Embed = Utils.Embed;
const { config, lang } = Utils.variables;

module.exports = {
  name: 'lock',
  run: async (bot, message, args) => {

    if (config.Moderation.Logs.Enabled && !Utils.findChannel(config.Moderation.Logs.Channel, message.guild)) return message.channel.send(Embed({ preset: 'console' }));
    if (bot.lockedChannels && bot.lockedChannels.includes(message.channel.id)) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Commands.Lock.AlreadyLocked }));
    
    bot.cachedChannelOverwrites = new Map();
    bot.cachedChannelOverwrites.set(message.channel.name, message.channel.permissionOverwrites)

    let overwrites = [];
    await Utils.asyncForEach(message.guild.roles.cache.array(), async (r, i) => {
      if (Object.values(config.LockUnlock.Ignore).find(i => i.toLowerCase() == r.name.toLowerCase() || r.id == i.id)) {
        let roleOverwrites = message.channel.permissionOverwrites.get(r.id)
        if (roleOverwrites) overwrites.push({ id: r.id, allow: roleOverwrites.allow, deny: roleOverwrites.deny})
        return;
      }
      if (Object.values(config.LockUnlock.Whitelisted).find(w => w.toLowerCase() == r.name.toLowerCase() || r.id == w.id)) overwrites.push({ id: r.id, allow: ['SEND_MESSAGES'] })
      else overwrites.push({ id: r.id, deny: ['SEND_MESSAGES'] });
    });

    await message.channel.overwritePermissions(overwrites).catch(console.log);

    if (!bot.lockedChannels) bot.lockedChannels = [];
    bot.lockedChannels.push(message.channel.id)

    message.channel.send(Embed({
      color: config.EmbedColors.Success,
      title: lang.ModerationModule.Commands.Lock.Locked
    }))

    if (config.Moderation.Logs.Enabled) {
      Utils.findChannel(config.Moderation.Logs.Channel, message.guild).send(Embed({
        title: lang.ModerationModule.Commands.Lock.Log.Title,
        fields: [{ name: lang.ModerationModule.Commands.Lock.Log.Fields[0], value: '<#' + message.channel.id + '>' }, { name: lang.ModerationModule.Commands.Lock.Log.Fields[1], value: '<@' + message.member.id + '>' }],
        timestamp: new Date()
      }))
    }
  },
  description: "Lock the channel so users cannot send messages",
  usage: 'lock',
  aliases: []
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065