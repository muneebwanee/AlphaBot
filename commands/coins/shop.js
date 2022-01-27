const Discord = require("discord.js");
const Utils = require("../../modules/utils.js")
const Embed = Utils.Embed;
const { config, lang, embeds } = Utils.variables;
module.exports = {
  name: 'shop',
  run: async (bot, message, args) => {
    if (!config.Coins.Shop.Enabled) return;
    let items = config.Coins.Shop.Items;
    let page = +args[0] || 1;

    if (page > Math.ceil(items.length / 5)) page = 1;

    let fields = items
      .slice((page - 1) * 5, 5 * page)
      .map(item => {

        let replace = text => {
          return text
            .replace("{item-display}", item.Display)
            .replace("{item-name}", item.Name)
            .replace("{item-role}", item.Role)
            .replace("{item-price}", item.Price)
            .replace("{item-description}", item.Description)
        }

        return { name: replace(embeds.Embeds.Shop.Format[0]), value: replace(embeds.Embeds.Shop.Format[1]) }
      })

    let embed = Utils.setupEmbed({
      configPath: embeds.Embeds.Shop,
      fields: fields,
      variables: [
        { searchFor: "{current-page}", replaceWith: page },
        { searchFor: "{max-pages}", replaceWith: Math.ceil(items.length / 5) }
      ]
    })
    message.channel.send(embed);
  },
  description: "View the Discord server's shop",
  usage: 'shop [page number]',
  aliases: [
    'store'
  ]
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065