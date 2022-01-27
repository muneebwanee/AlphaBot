const Discord = require("discord.js");
const Utils = require("../../modules/utils.js")
const Embed = Utils.Embed;
const { config, lang } = Utils.variables;
const fs = require("fs");
const Commands = require('../../modules/handlers/CommandHandler').commands;

module.exports = {
  name: 'help',
  run: async (bot, message, args) => {
    const prefix = await Utils.variables.db.get.getPrefixes(message.guild.id);
    let modules = {
      general: await Utils.variables.db.get.getModules('general'),
      tickets: await Utils.variables.db.get.getModules('tickets'),
      coins: await Utils.variables.db.get.getModules('coins'),
      exp: await Utils.variables.db.get.getModules('exp'),
      other: await Utils.variables.db.get.getModules('other'),
      fun: await Utils.variables.db.get.getModules('fun'),
      minecraft: await Utils.variables.db.get.getModules('minecraft'),
      music: await Utils.variables.db.get.getModules('music')
    }

    let musicAddon = fs.existsSync("./addons/music.js");
    let ultimateMusicAddon = fs.existsSync("./addons/ultimatemusic.js");

    function capitalize(str) {
      return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
    }
    let command = args[0] ? Commands.filter(c => !['mod', 'admin', 'management', 'giveaways', 'utils', 'staff'].includes(c.type)).find(c => c.command == args[0].toLowerCase() || c.aliases.find(a => a == args[0].toLowerCase())) : undefined;
    if (args[0] && command && args[0] !== "coins" && args[0] !== "xp") {
      return message.channel.send(Embed({
        title: capitalize(command.command) + ' Command',
        fields: [
          { name: 'Description', value: command.description },
          { name: 'Aliases', value: command.aliases.map(a => prefix + a).join('\n').length < 1 ? 'None' : command.aliases.map(a => prefix + a).join('\n') },
          { name: 'Usage', value: prefix + command.usage },
          { name: 'Type', value: capitalize(command.type) }
        ]
      }))
    }

    let CommandList = require("../../modules/methods/generateHelpMenu");
    if (!CommandList.normal || !CommandList.staff) await CommandList.setup();

    if (config.Other.HelpMenu == 'categorized') {
      let help = Utils.setupEmbed({
        configPath: Utils.variables.embeds.Embeds.CategorizedHelp,
        title: lang.Help.HelpMenuTitle,
        variables: [
          { searchFor: /{prefix}/g, replaceWith: prefix }
        ]
      })

      let embeds = {
        general: Embed({
          title: lang.Help.CategoryMenuTitles[3],
          description: CommandList.normal.general.replace(/{prefix}/g, prefix)
        }),
        tickets: Embed({
          title: lang.Help.CategoryMenuTitles[4],
          description: CommandList.normal.tickets.replace(/{prefix}/g, prefix)
        }),
        coins: Embed({
          title: lang.Help.CategoryMenuTitles[5],
          description: CommandList.normal.coins.replace(/{prefix}/g, prefix)
        }),
        exp: Embed({
          title: lang.Help.CategoryMenuTitles[6],
          description: CommandList.normal.exp.replace(/{prefix}/g, prefix)
        }),
        other: Embed({
          title: lang.Help.CategoryMenuTitles[7],
          description: CommandList.normal.other.replace(/{prefix}/g, prefix)
        }),
        fun: Embed({
          title: lang.Help.CategoryMenuTitles[8],
          description: CommandList.normal.fun.replace(/{prefix}/g, prefix)
        }),
        minecraft: Embed({
          title: lang.Help.CategoryMenuTitles[9],
          description: CommandList.normal.minecraft.replace(/{prefix}/g, prefix)
        }),
        music: Embed({
          title: lang.Help.CategoryMenuTitles[11],
          description: CommandList.normal.music.replace(/{prefix}/g, prefix)
        }),
      }

      function sendHelpMenu() {
        message.channel.send(help).then(async msg => {
          if (modules.general && modules.general.enabled == true && CommandList.normal.general.length > 0) await msg.react('🙂');
          if (modules.tickets && modules.tickets.enabled == true && CommandList.normal.tickets.length > 0) await msg.react('🎟️');
          if (modules.coins && modules.coins.enabled == true && CommandList.normal.coins.length > 0) await msg.react('💰');
          if (modules.exp && modules.exp.enabled == true && CommandList.normal.exp.length > 0) await msg.react('✨');
          if (modules.fun && modules.fun.enabled == true && CommandList.normal.fun.length > 0) await msg.react('🎮');
          if (modules.minecraft && modules.minecraft.enabled == true && CommandList.normal.minecraft.length > 0) await msg.react('⛏️');
          if (modules.music && modules.music.enabled == true && CommandList.normal.music.length > 0 && (musicAddon || ultimateMusicAddon)) await msg.react('🎵');
          if (modules.other && modules.other.enabled == true && CommandList.normal.other.length > 0) await msg.react('🗂️');
        });
      }

      const category = args[0] ? args[0].toLowerCase() : undefined;

      if (category) {
        if (category == 'general' && modules.general && modules.general.enabled == true && CommandList.normal.general.length > 0) return message.channel.send(embeds.general);
        else if (category == 'tickets' && modules.tickets && modules.tickets.enabled == true && CommandList.normal.tickets.length > 0) return message.channel.send(embeds.tickets);
        else if (category == 'coins' && modules.coins && modules.coins.enabled == true && CommandList.normal.coins.length > 0) return message.channel.send(embeds.coins);
        else if (category == 'xp' && modules.exp && modules.exp.enabled == true && CommandList.normal.exp.length > 0) return message.channel.send(embeds.exp);
        else if (category == 'other' && modules.other && modules.other.enabled == true && CommandList.normal.other.length > 0) return message.channel.send(embeds.other);
        else if (category == 'fun' && modules.fun && modules.fun.enabled == true && CommandList.normal.fun.length > 0) return message.channel.send(embeds.fun);
        else if (category == 'minecraft' && modules.minecraft && modules.minecraft.enabled == true && CommandList.normal.minecraft.length > 0) return message.channel.send(embeds.minecraft);
        else if (category == 'music' && modules.music && modules.music.enabled == true && CommandList.normal.music.length > 0 && (musicAddon || ultimateMusicAddon)) return message.channel.send(embeds.music);
        else sendHelpMenu()
      } else sendHelpMenu()
    }
    if (['normal', 'dm'].includes(config.Other.HelpMenu)) {
      let help = Embed({
        title: lang.Help.HelpMenuTitle,
        fields: []
      });

      if (modules.general && modules.general.enabled == true && CommandList.normal.general.length > 0) {
        if (CommandList.normal.general.length <= 1024) {
          help.embed.fields.push({ name: lang.Help.CategoryNames[3], value: CommandList.normal.general.replace(/{prefix}/g, prefix) });
        } else {
          let desc = CommandList.normal.general.replace(/{prefix}/g, prefix)
          help.embed.fields.push({ name: lang.Help.CategoryNames[3], value: desc.substring(0, desc.substring(0, 1024).lastIndexOf('**' + prefix)) });
          help.embed.fields.push({ name: '\u200B', value: desc.substring(desc.substring(0, 1024).lastIndexOf('**' + prefix)) });
        }
      }

      if (modules.tickets && modules.tickets.enabled == true && CommandList.normal.tickets.length > 0) {
        if (CommandList.normal.tickets.length <= 1024) {
          help.embed.fields.push({ name: lang.Help.CategoryNames[4], value: CommandList.normal.tickets.replace(/{prefix}/g, prefix) });
        } else {
          let desc = CommandList.normal.tickets.replace(/{prefix}/g, prefix)
          help.embed.fields.push({ name: lang.Help.CategoryNames[4], value: desc.substring(0, desc.substring(0, 1024).lastIndexOf('**' + prefix)) });
          help.embed.fields.push({ name: '\u200B', value: desc.substring(desc.substring(0, 1024).lastIndexOf('**' + prefix)) });
        }
      }

      if (modules.coins && modules.coins.enabled == true && CommandList.normal.coins.length > 0) {
        if (CommandList.normal.coins.length <= 1024) {
          help.embed.fields.push({ name: lang.Help.CategoryNames[5], value: CommandList.normal.coins.replace(/{prefix}/g, prefix) });
        } else {
          let desc = CommandList.normal.coins.replace(/{prefix}/g, prefix)
          help.embed.fields.push({ name: lang.Help.CategoryNames[5], value: desc.substring(0, desc.substring(0, 1024).lastIndexOf('**' + prefix)) });
          help.embed.fields.push({ name: '\u200B', value: desc.substring(desc.substring(0, 1024).lastIndexOf('**' + prefix)) });
        }
      }

      if (modules.exp && modules.exp.enabled == true && CommandList.normal.exp.length > 0) {
        if (CommandList.normal.exp.length <= 1024) {
          help.embed.fields.push({ name: lang.Help.CategoryNames[6], value: CommandList.normal.exp.replace(/{prefix}/g, prefix) });
        } else {
          let desc = CommandList.normal.exp.replace(/{prefix}/g, prefix)
          help.embed.fields.push({ name: lang.Help.CategoryNames[6], value: desc.substring(0, desc.substring(0, 1024).lastIndexOf('**' + prefix)) });
          help.embed.fields.push({ name: '\u200B', value: desc.substring(desc.substring(0, 1024).lastIndexOf('**' + prefix)) });
        }
      }

      if (modules.fun && modules.fun.enabled == true && CommandList.normal.fun.length > 0) {
        if (CommandList.normal.fun.length <= 1024) {
          help.embed.fields.push({ name: lang.Help.CategoryNames[8], value: CommandList.normal.fun.replace(/{prefix}/g, prefix) });
        } else {
          let desc = CommandList.normal.fun.replace(/{prefix}/g, prefix)
          help.embed.fields.push({ name: lang.Help.CategoryNames[8], value: desc.substring(0, desc.substring(0, 1024).lastIndexOf('**' + prefix)) });
          help.embed.fields.push({ name: '\u200B', value: desc.substring(desc.substring(0, 1024).lastIndexOf('**' + prefix)) });
        }
      }

      if (modules.minecraft && modules.minecraft.enabled == true && CommandList.normal.minecraft.length > 0) {
        if (CommandList.normal.minecraft.length <= 1024) {
          help.embed.fields.push({ name: lang.Help.CategoryNames[9], value: CommandList.normal.minecraft.replace(/{prefix}/g, prefix) });
        } else {
          let desc = CommandList.normal.minecraft.replace(/{prefix}/g, prefix)
          help.embed.fields.push({ name: lang.Help.CategoryNames[9], value: desc.substring(0, desc.substring(0, 1024).lastIndexOf('**' + prefix)) });
          help.embed.fields.push({ name: '\u200B', value: desc.substring(desc.substring(0, 1024).lastIndexOf('**' + prefix)) });
        }
      }

      if (modules.other && modules.other.enabled == true && CommandList.normal.other.length > 0) {
        if (CommandList.normal.other.length <= 1024) {
          help.embed.fields.push({ name: lang.Help.CategoryNames[7], value: CommandList.normal.other.replace(/{prefix}/g, prefix) });
        } else {
          let desc = CommandList.normal.other.replace(/{prefix}/g, prefix)
          help.embed.fields.push({ name: lang.Help.CategoryNames[7], value: desc.substring(0, desc.substring(0, 1024).lastIndexOf('**' + prefix)) });
          help.embed.fields.push({ name: '\u200B', value: desc.substring(desc.substring(0, 1024).lastIndexOf('**' + prefix)) });
        }
      }

      let musicAddon = fs.existsSync("./addons/music.js");
      let ultimateMusicAddon = fs.existsSync("./addons/ultimatemusic.js");

      if (modules.music && modules.music.enabled == true && CommandList.normal.music.length > 0 && (musicAddon || ultimateMusicAddon)) {
        if (CommandList.normal.music.length <= 1024) {
          help.embed.fields.push({ name: lang.Help.CategoryNames[11], value: CommandList.normal.music.replace(/{prefix}/g, prefix) });
        } else {
          let desc = CommandList.normal.music.replace(/{prefix}/g, prefix)
          help.embed.fields.push({ name: lang.Help.CategoryNames[11], value: desc.substring(0, desc.substring(0, 1024).lastIndexOf('**' + prefix)) });
          help.embed.fields.push({ name: '\u200B', value: desc.substring(desc.substring(0, 1024).lastIndexOf('**' + prefix)) });
        }
      }


      if (help.embed.fields.length == 0) return;
      if (config.Other.HelpMenu == 'dm') {
        message.member.send(help)
          .then(msg => {
            message.channel.send(Embed({
              title: lang.Help.HelpMenuTitle,
              description: lang.Help.SentToDMs,
              color: config.EmbedColors.Success
            }))
          })
          .catch(err => {
            return message.channel.send(Embed({ preset: "error", description: lang.Help.DMsLocked }))
          })
      } else message.channel.send(help)
    }
  },
  description: "View the command help menu",
  usage: 'help',
  aliases: []
}
// 239232   8501   2161065    52657   1611445495   LEHASH__%%   2161065