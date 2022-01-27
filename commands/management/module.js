const Utils = require('../../modules/utils');
const { capitalize } = require('lodash');
const Embed = Utils.Embed;
const lang = Utils.variables.lang

module.exports = {
    name: "modules",
    run: async (bot, message, args) => {
        const CommandHandler = require('../../modules/handlers/CommandHandler');

        if (args.length == 0) {
            let listedModules = await Promise.all([...new Set(CommandHandler.commands.map(c => c.type))].map(async m => {
                let module = await Utils.variables.db.get.getModules(m)
                if (!module) return undefined
                return (module.enabled ? '✅ ' : '❌ ') + '**' + capitalize(m) + '**'
            }))

            let alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]
            listedModules = listedModules.filter(module => module).sort((a, b) => {
                return alphabet.indexOf(a.slice(4).charAt(0).toLowerCase()) - alphabet.indexOf(b.slice(4).charAt(0).toLowerCase())
            })

            message.channel.send(Utils.Embed({
                title: lang.ManagementModule.Commands.Module.Embeds.List.Title,
                description: lang.ManagementModule.Commands.Module.Embeds.List.Description.replace(/{modules}/g, listedModules.join("\n")),
                footer: lang.ManagementModule.Commands.Module.Embeds.List.Footer.replace(/{prefix}/g, await Utils.variables.db.get.getPrefixes(message.guild.id))
            }))
        } else {

            if (!CommandHandler.commands.map(c => c.type).includes(args[0].toLowerCase())) return message.channel.send(Embed({ preset: 'error', description: lang.ManagementModule.Commands.Module.Errors.InvalidModule }))

            const module = await Utils.variables.db.get.getModules(args[0].toLowerCase())

            if (args.length == 1) {
                message.channel.send(Embed({
                    title: lang.ManagementModule.Commands.Module.Embeds.Module.Title.replace(/{module}/g, capitalize(args[0])),
                    fields: [
                        {
                            name: lang.ManagementModule.Commands.Module.Embeds.Module.Fields[0],
                            value: module.enabled ? lang.ManagementModule.Commands.Module.Embeds.Module.Status[0] : lang.ManagementModule.Commands.Module.Embeds.Module.Status[1]
                        },
                        {
                            name: lang.ManagementModule.Commands.Module.Embeds.Module.Fields[1],
                            value: CommandHandler.commands.filter(c => c.type == args[0].toLowerCase()).map(c => capitalize(c.command)).join("\n")
                        }
                    ]
                }))
            } else {
                if (args[0].toLowerCase() == 'management') return message.channel.send(Embed({ preset: 'error', description: lang.ManagementModule.Commands.Module.Errors.StatusCantBeModified }))

                const newStatus = args[1].toLowerCase()

                if (!['enable', 'disable'].includes(newStatus)) return message.channel.send(Embed({ preset: 'error', description: lang.ManagementModule.Commands.Module.Errors.InvalidStatus }));

                await Utils.variables.db.update.modules.setModule(args[0].toLowerCase(), newStatus == 'enable' ? true : false);

                CommandHandler.commands.filter(command => command.type == args[0].toLowerCase()).forEach(command => {
                    command.enabled = newStatus == 'enable' ? true : false;
                })

                message.channel.send(Embed({
                    title: lang.ManagementModule.Commands.Module.Embeds.EnabledDisabled.Title.replace(/{status}/g, capitalize(newStatus) + 'd'),
                    description: lang.ManagementModule.Commands.Module.Embeds.EnabledDisabled.Description.replace(/{module}/g, capitalize(args[0].toLowerCase())).replace(/{status}/g, newStatus + 'd')
                }))
            }
        }
    },
    description: "Enable or disable a module",
    usage: 'modules [module] [enable|disable]',
    aliases: [
        'module'
    ]
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065