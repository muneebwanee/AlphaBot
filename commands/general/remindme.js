const Utils = require("../../modules/utils.js")
const Embed = Utils.Embed;
const { config, lang } = Utils.variables;
const ms = require("ms");
module.exports = {
  name: 'remindme',
  run: async (bot, message, args, { prefixUsed, commandUsed }) => {

    if (!bot.reminders) bot.reminders = new Map()

    if (args[0] == 'list') {
      let reminders = bot.reminders.get(message.author.id);

      if (!reminders || !reminders.length) message.channel.send(Embed({ title: lang.GeneralModule.Commands.Remindme.List.NoReminders.Title, description: lang.GeneralModule.Commands.Remindme.List.NoReminders.Description }))
      else return message.channel.send(Embed({
        title: lang.GeneralModule.Commands.Remindme.List.Reminders.Title,
        fields: reminders.map((reminder, i) => {
          return {
            name: lang.GeneralModule.Commands.Remindme.List.Reminders.Format[0].replace(/{id}/g, i + 1),
            value: lang.GeneralModule.Commands.Remindme.List.Reminders.Format[1].replace(/{description}/g, reminder.description).replace(/{timer}/g, Utils.getTimeDifference(new Date(), reminder.endDate))
          }
        })
      }))
    }
    else if (args[0] == 'cancel') {
      if (args[1] && parseInt(args[1])) {
        let reminders = bot.reminders.get(message.author.id);

        if (!reminders || !reminders.length) return message.channel.send(Embed({ preset: "error", description: lang.GeneralModule.Commands.Remindme.Cancel.NoReminders }))

        let reminder = reminders[parseInt(args[1]) - 1];

        if (!reminder) return message.channel.send(Embed({ preset: 'error', description: lang.GeneralModule.Commands.Remindme.Cancel.InvalidID }));

        reminders.splice(reminders.indexOf(reminder), 1);
        clearTimeout(reminder.timeout)

        message.channel.send(Embed({
          title: lang.GeneralModule.Commands.Remindme.Cancel.Canceled.Title,
          description: lang.GeneralModule.Commands.Remindme.Cnacel.Canceled.Description.replace(/{reminder}/g, reminder.description)
        }))
      } else {
        return message.channel.send(Embed({ preset: 'invalidargs', usage: 'remindme cancel <reminder id>' }))
      }
    }
    else if (args.length > 0 && args[0] !== "help") {
      if (!/\d+.+/.exec(args[0]) || /\d$/.exec(args[0])) return message.channel.send(Embed({ preset: 'error', description: lang.GeneralModule.Commands.Remindme.Set.InvalidTime }));
      if (args.length < 2) return message.channel.send(Embed({ preset: "invalidargs", usage: 'remindme <time> <reminder>' }));

      let reminders = bot.reminders.get(message.author.id);

      if (!reminders) {
        bot.reminders.set(message.author.id, [])
        reminders = bot.reminders.get(message.author.id)
      }

      let reminder = args.slice(1).join(" ");
      let start = new Date();
      let end = new Date();
      end.setMilliseconds(end.getMilliseconds() + ms(args[0]));

      reminders.push({
        description: reminder,
        timeout: setTimeout(() => {
          reminders.splice(reminders.splice(reminder), 1)
          message.member.send(Embed({ title: lang.GeneralModule.Commands.Remindme.Set.Reminder.Title, description: lang.GeneralModule.Commands.Remindme.Set.Reminder.Description.replace(/{reminder}/g, reminder).replace(/{user}/g, `<@${message.author.id}>`) })).catch(err => {
            message.channel.send(message.member, Embed({ title: lang.GeneralModule.Commands.Remindme.Set.Reminder.Title, description: message.author + lang.GeneralModule.Commands.Remindme.Set.Reminder.Description.replace(/{reminder}/g, reminder).replace(/{user}/g, `<@${message.author.id}>`) }));
          });
        }, ms(args[0])),
        startDate: start,
        endDate: end
      })

      message.channel.send(Embed({
        title: lang.GeneralModule.Commands.Remindme.Set.ReminderSet.Title,
        description: lang.GeneralModule.Commands.Remindme.Set.ReminderSet.Description.replace(/{reminder}/g, reminder).replace(/{timer}/g, Utils.getTimeDifference(start, end))
      }));
    } else {
      let prefix = await Utils.variables.db.get.getPrefixes(message.guild.id)
      message.channel.send(Embed({
        title: lang.GeneralModule.Commands.Remindme.Help.Title,
        description: lang.GeneralModule.Commands.Remindme.Help.Description,
        fields: [
          { name: lang.GeneralModule.Commands.Remindme.Help.Fields[0], value: prefix + 'remindme list', inline: true },
          { name: lang.GeneralModule.Commands.Remindme.Help.Fields[1], value: prefix + 'remindme <time> <reminder>', inline: true },
          { name: lang.GeneralModule.Commands.Remindme.Help.Fields[2], value: prefix + 'remindme cancel <id>', inline: true },
        ]
      }))
    }
  },
  description: "Make the bot remind you to do something",
  usage: 'remindme <list/cancel/time> [id/reminder description]',
  aliases: ['reminders', 'reminder', 'remind']
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065