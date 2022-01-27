const Utils = require("../../modules/utils.js")
const Embed = Utils.Embed;

module.exports = {
  name: 'say',
  run: async (bot, message, args, { prefixUsed, commandUsed }) => {

    const action = (args[0] || "").toLowerCase();
    if (action && args.length < 2 || !['embed', 'normal', 'advanced'].includes(action)) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));
    message.delete();

    const channel = Utils.ResolveChannel(message, 1, false, false) || message.channel;

    let msg = message.content.slice((
      // Prefix + command length
      (prefixUsed + commandUsed).length +
      // Action (embed or normal) length 
      action.length) + 1, message.content.length)

    // Remove channel if it is added
    if (channel.name !== message.channel.name)
      msg = msg.split(" ").slice(1).join(" ");

    if (action == 'normal') return channel.send(msg)
    else if (action == 'embed') return channel.send(Embed({ description: msg }));
    else if (action == "advanced") {
      let embed = {
        author: {},
        footer: {},
        thumbnail: {},
        image: {},
        fields: []
      }
      let text;

      msg.replace("_embed #channel", "").split("|").forEach(property => {
        property = property.trim()

        let key = property.substring(0, property.indexOf("=")).trim()
        let value = property.substring(property.indexOf("=") + 1).trim()

        if (key == "author") {
          let startOfName = value.indexOf("name=") == -1 ? undefined : value.indexOf("name=");
          let startOfIcon = value.indexOf("icon=") == -1 ? undefined : value.indexOf("icon=");
          let startOfURL = value.indexOf("url=") == -1 ? undefined : value.indexOf("url=");

          let name = typeof startOfName == "number" ? value.substring(startOfName + 5, startOfIcon || startOfURL).trim() : undefined;
          let icon = typeof startOfIcon == "number" ? value.substring(startOfIcon + 5, startOfURL || startOfIcon).trim() : undefined;
          let url = typeof startOfURL == "number" ? value.substring(startOfURL + 4).trim() : undefined;

          if (icon == "me") icon = message.author.displayAvatarURL({ dynamic: true });
          if (icon == "bot") icon = bot.user.displayAvatarURL({ dynamic: true });
          if (url == "me") url = message.author.displayAvatarURL({ dynamic: true });
          if (url == "bot") url = bot.user.displayAvatarURL({ dynamic: true });

          embed.author.name = name;
          embed.author.iconURL = icon;
          embed.author.url = url;

        } else if (key == "thumbnail") {
          if (value == "me") value = message.author.displayAvatarURL({ dynamic: true });
          if (value == "bot") value = bot.user.displayAvatarURL({ dynamic: true });

          embed.thumbnail.url = value;
        } else if (key == "image") {
          if (value == "me") value = message.author.displayAvatarURL({ dynamic: true });
          if (value == "bot") value = bot.user.displayAvatarURL({ dynamic: true });

          embed.image.url = value;
        } else if (key == "footer") {
          let startOfName = value.indexOf("name=") == -1 ? undefined : value.indexOf("name=");
          let startOfIcon = value.indexOf("icon=") == -1 ? undefined : value.indexOf("icon=");

          if (startOfName == undefined) return embed.footer.text = value;

          let name = typeof startOfName == "number" ? value.substring(startOfName + 5, startOfIcon).trim() : undefined;
          let icon = typeof startOfIcon == "number" ? value.substring(startOfIcon + 5).trim() : undefined;

          if (icon == "me") icon = message.author.displayAvatarURL({ dynamic: true });
          if (icon == "bot") icon = bot.user.displayAvatarURL({ dynamic: true });

          embed.footer.text = name;
          embed.footer.iconURL = icon;
        } else if (key == "color") {
          embed[key] = parseInt(value.replace("#", ""), 16);
        } else if (key == "field") {
          let startOfName = value.indexOf("name=") == -1 ? undefined : value.indexOf("name=");
          let startOfValue = value.indexOf("value=") == -1 ? undefined : value.indexOf("value=");
          let startOfInline = value.indexOf("inline=");

          let name = typeof startOfName == "number" ? value.substring(startOfName + 5, startOfValue).trim() : undefined;
          let v = typeof startOfValue == "number" ? value.substring(startOfValue + 6, startOfInline == -1 ? undefined : startOfInline).trim() : undefined;
          let inline = startOfInline == -1 ? true : value.substring(startOfInline + 7).trim();

          if (typeof inline == "string") inline = inline == "false" || inline == "no" ? false : true;
          if (!name || !v) return;

          embed.fields.push({ name, value: v, inline })
        } else if (key == "ptext") {
          text = value
        } else embed[key] = value;
      });

      if (!embed.color) embed.color = Utils.variables.config.EmbedColors.Default;

      message.channel.send(text, { embed: embed })
    }
  },
  description: "Make the bot send a certain message",
  usage: 'say <normal/embed/advanced> <message/embed properties>',
  aliases: []
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065