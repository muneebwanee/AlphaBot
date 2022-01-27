const Utils = require('../../modules/utils');
const { capitalize } = require('lodash');
const Embed = Utils.Embed;
const lang = Utils.variables.lang
const fs = require("fs");

module.exports = {
    name: "command",
    run: async (bot, message, args) => {
        const CommandHandler = require('../../modules/handlers/CommandHandler');

        let listedCommands = await Promise.all(CommandHandler.commands.map(async c => {
            let cmd = await Utils.variables.db.get.getCommands(c.command);
            if (!cmd) return undefined
            return `${cmd.enabled ? '✅ ' : '❌ '}` + '**' + capitalize(c.command) + '**'
        }))

        let alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]
        listedCommands = listedCommands.filter(command => command).sort((a, b) => {
            return alphabet.indexOf(a.slice(4).charAt(0).toLowerCase()) - alphabet.indexOf(b.slice(4).charAt(0).toLowerCase())
        })

        let p = +args[0] || 1;

        if (p > Math.ceil(listedCommands.length / 20)) p = 1;

        let page = listedCommands.slice((p - 1) * 20, 20 * p)

        if (args.length == 0) {
            message.channel.send(Embed({
                title: lang.ManagementModule.Commands.Command.Embeds.List.Title.replace(/{current-page}/g, 1).replace(/{max-pages}/g, Math.ceil(listedCommands.length / 20)),
                description: lang.ManagementModule.Commands.Command.Embeds.List.Description.replace(/{commands}/g, page.join("\n")),
                footer: lang.ManagementModule.Commands.Command.Embeds.List.Footer.replace(/{prefix}/g, await Utils.variables.db.get.getPrefixes(message.guild.id))
            }))
        } else if (/\d+$/.test(args[0]) && args[0].length == 1) {
            message.channel.send(Utils.Embed({
                title: lang.ManagementModule.Commands.Command.Embeds.List.Title.replace(/{current-page}/g, p).replace(/{max-pages}/g, Math.ceil(listedCommands.length / 20)),
                description: lang.ManagementModule.Commands.Command.Embeds.List.Description.replace(/{commands}/g, page.join("\n")),
                footer: lang.ManagementModule.Commands.Command.Embeds.List.Footer.replace(/{prefix}/g, await Utils.variables.db.get.getPrefixes(message.guild.id))
            }))
        } else {
            const command = CommandHandler.commands.find(c => c.command == args[0].toLowerCase());

            if (!command) return message.channel.send(Embed({ preset: 'error', description: lang.ManagementModule.Commands.Command.Errors.InvalidCommand }))

            if (args.length == 1) {
                message.channel.send(Embed({
                    title: lang.ManagementModule.Commands.Command.Embeds.Command.Title.replace(/{command}/g, capitalize(args[0].toLowerCase())),
                    fields: [
                        {
                            name: lang.ManagementModule.Commands.Command.Embeds.Command.Fields[0],
                            value: command.enabled && Utils.variables.commands.Enabled[command.command] ? lang.ManagementModule.Commands.Command.Embeds.Command.Status[0] : lang.ManagementModule.Commands.Command.Embeds.Command.Status[1]
                        }
                    ]
                }))
            } else {
                if (command.type == 'management') return message.channel.send(Embed({ preset: 'error', description: lang.ManagementModule.Commands.Command.Errors.StatusCantBeModified }))

                const newStatus = args[1].toLowerCase()

                if (!['enable', 'disable'].includes(newStatus)) return message.channel.send(Embed({ preset: 'error', description: lang.ManagementModule.Commands.Command.Errors.InvalidStatus }));

                await Utils.variables.db.update.commands.setCommand(args[0].toLowerCase(), newStatus == 'enable' ? true : false);
                command.enabled = newStatus == 'enable' ? true : false;

                if (command.enabled !== Utils.variables.commands.Enabled[command.command]) {
                    let file = fs.readFileSync("./commands.yml", "utf8")

                    file = file.replace(`${command.command}: ${Utils.variables.commands.Enabled[command.command]}`, `${command.command}: ${command.enabled}`)
                    fs.writeFileSync("./commands.yml", file)
                    await require("../../modules/methods/reloadBot")(bot, 'config')
                }

                message.channel.send(Embed({
                    title: lang.ManagementModule.Commands.Command.Embeds.EnabledDisabled.Title.replace(/{status}/g, capitalize(newStatus) + 'd'),
                    description: lang.ManagementModule.Commands.Command.Embeds.EnabledDisabled.Description.replace(/{command}/g, capitalize(command.command)).replace(/{status}/g, newStatus + 'd')
                }))
            }
        }
    },
    description: "Enable or disable a command",
    usage: 'command [command] [enable|disable]',
    aliases: [
        'commands'
    ]
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065