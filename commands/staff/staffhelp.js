const Utils = require("../../modules/utils.js")
const Embed = Utils.Embed;
const { config, lang } = Utils.variables;
const Commands = require('../../modules/handlers/CommandHandler').commands;

module.exports = {
    name: 'staffhelp',
    run: async (bot, message, args) => {
        const prefix = await Utils.variables.db.get.getPrefixes(message.guild.id);
        let modules = {
            mod: await Utils.variables.db.get.getModules('mod'),
            admin: await Utils.variables.db.get.getModules('admin'),
            management: await Utils.variables.db.get.getModules('management'),
            giveaways: await Utils.variables.db.get.getModules('giveaways')
        }

        function capitalize(str) {
            return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
        }
        let command = args[0] ? Commands.filter(c => !['general', 'tickets', 'coins', 'exp', 'other'].includes(c.type)).find(c => c.command == args[0].toLowerCase() || c.aliases.find(a => a == args[0].toLowerCase())) : undefined;
        if (args[0] && command) {
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

        if (config.Other.HelpMenu.toLowerCase() == 'categorized') {
            let staff = Utils.setupEmbed({
                configPath: Utils.variables.embeds.Embeds.CategorizedStaffHelp,
                title: lang.Help.StaffHelpMenuTitle,
                variables: [
                    { searchFor: /{prefix}/g, replaceWith: prefix }
                ]
            })

            let embeds = {
                mod: Embed({
                    title: lang.Help.CategoryMenuTitles[0],
                    description: CommandList.staff.mod.replace(/{prefix}/g, prefix)
                }),
                admin: Embed({
                    title: lang.Help.CategoryMenuTitles[1],
                    description: CommandList.staff.admin.replace(/{prefix}/g, prefix)
                }),
                giveaways: Embed({
                    title: lang.Help.CategoryMenuTitles[10],
                    description: CommandList.staff.giveaways.replace(/{prefix}/g, prefix)
                }),
                management: Embed({
                    title: lang.Help.CategoryMenuTitles[2],
                    description: CommandList.staff.management.replace(/{prefix}/g, prefix)
                })
            }

            function sendHelpMenu() {
                message.channel.send(staff).then(async msg => {
                    if (modules.mod.enabled == true && CommandList.staff.mod.length > 0) await msg.react('👮');
                    if (modules.admin.enabled == true && CommandList.staff.admin.length > 0) await msg.react('🛠');
                    if (modules.giveaways.enabled == true && CommandList.staff.giveaways.length > 0) await msg.react('🎉');
                    if (modules.management.enabled == true && CommandList.staff.management.length > 0) await msg.react('🖥️');
                });
            }

            const category = args[0] ? args[0].toLowerCase() : undefined;
            if (category) {
                if (category == 'moderation' && modules.mod.enabled == true && CommandList.staff.mod.length > 0) return message.channel.send(embeds.mod);
                if (category == 'admin' && modules.admin.enabled == true && CommandList.staff.admin.length > 0) return message.channel.send(embeds.admin);
                if (category == 'giveaways' && modules.giveaways.enabled == true && CommandList.staff.giveaways.length > 0) return message.channel.send(embeds.giveaways);
                if (category == 'management' && modules.management.enabled == true && CommandList.staff.management.length > 0) return message.channel.send(embeds.management);
                else sendHelpMenu()
            } else sendHelpMenu()
        }
        if (['normal', 'dm'].includes(config.Other.HelpMenu)) {
            let staff = Embed({
                title: lang.Help.StaffHelpMenuTitle,
                fields: []
            });

            if (modules.mod.enabled == true && CommandList.staff.mod.length > 0) {
                if (CommandList.staff.mod.length <= 1024) {
                    staff.embed.fields.push({ name: lang.Help.CategoryNames[0], value: CommandList.staff.mod.replace(/{prefix}/g, prefix) });
                } else {
                    let desc = CommandList.staff.mod.replace(/{prefix}/g, prefix)
                    staff.embed.fields.push({ name: lang.Help.CategoryNames[0], value: desc.substring(0, desc.substring(0, 1024).lastIndexOf('**' + prefix)) });
                    staff.embed.fields.push({ name: '\u200B', value: desc.substring(desc.substring(0, 1024).lastIndexOf('**' + prefix)) });
                }
            }

            if (modules.admin.enabled == true && CommandList.staff.admin.length > 0) {
                if (CommandList.staff.admin.length <= 1024) {
                    staff.embed.fields.push({ name: lang.Help.CategoryNames[1], value: CommandList.staff.admin.replace(/{prefix}/g, prefix) });
                } else {
                    let desc = CommandList.staff.admin.replace(/{prefix}/g, prefix)
                    staff.embed.fields.push({ name: lang.Help.CategoryNames[1], value: desc.substring(0, desc.substring(0, 1024).lastIndexOf('**' + prefix)) });
                    staff.embed.fields.push({ name: '\u200B', value: desc.substring(desc.substring(0, 1024).lastIndexOf('**' + prefix)) });
                }
            }

            if (modules.giveaways.enabled == true && CommandList.staff.giveaways.length > 0) {
                if (CommandList.staff.giveaways.length <= 1024) {
                    staff.embed.fields.push({ name: lang.Help.CategoryNames[10], value: CommandList.staff.giveaways.replace(/{prefix}/g, prefix) });
                } else {
                    let desc = CommandList.staff.giveaways.replace(/{prefix}/g, prefix)
                    staff.embed.fields.push({ name: lang.Help.CategoryNames[10], value: desc.substring(0, desc.substring(0, 1024).lastIndexOf('**' + prefix)) });
                    staff.embed.fields.push({ name: '\u200B', value: desc.substring(desc.substring(0, 1024).lastIndexOf('**' + prefix)) });
                }
            }

            if (modules.management.enabled == true && CommandList.staff.management.length > 0) {
                if (CommandList.staff.management.length <= 1024) {
                    staff.embed.fields.push({ name: lang.Help.CategoryNames[2], value: CommandList.staff.management.replace(/{prefix}/g, prefix) });
                } else {
                    let desc = CommandList.staff.management.replace(/{prefix}/g, prefix)
                    staff.embed.fields.push({ name: lang.Help.CategoryNames[2], value: desc.substring(0, desc.substring(0, 1024).lastIndexOf('**' + prefix)) });
                    staff.embed.fields.push({ name: '\u200B', value: desc.substring(desc.substring(0, 1024).lastIndexOf('**' + prefix)) });
                }
            }

            if (staff.embed.fields.length == 0) return;
            if (config.Other.HelpMenu == 'dm') {
                message.member.send(staff)
                    .then(msg => {
                        message.channel.send(Embed({
                            title: lang.Help.StaffHelpMenuTitle,
                            description: lang.Help.SentToDMs,
                            color: config.EmbedColors.Success
                        }))
                    })
                    .catch(err => {
                        return message.channel.send(Embed({ preset: "error", description: lang.Help.DMsLocked }))
                    })
            } else message.channel.send(staff);
        }
    },
    description: "View the staff command help menu",
    usage: 'staffhelp',
    aliases: [
        'shelp'
    ]
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065