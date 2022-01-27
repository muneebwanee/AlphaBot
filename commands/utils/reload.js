const Role_Required = "Admin";
const Utils = require('../../modules/utils');
const fs = require('fs');
const lang = Utils.variables.lang;

module.exports = {
    name: 'reload',
    run: async (bot, message, args) => {

        const reload = require("../../modules/methods/reloadBot");

        if (args.length == 0) {
            const msg = await message.channel.send(Utils.Embed({
                title: lang.ManagementModule.Commands.Reload.Bot[0]
            }))

            await reload(bot, 'all')

            msg.edit(Utils.Embed({
                color: Utils.variables.config.EmbedColors.Success,
                title: lang.ManagementModule.Commands.Reload.Bot[1]
            }))
        } else {
            const action = args[0].toLowerCase();

            if (action == 'addons') {
                const msg = await message.channel.send(Utils.Embed({
                    title: lang.ManagementModule.Commands.Reload.Addons[0]
                }))

                await reload(bot, 'addons')

                msg.edit(Utils.Embed({
                    color: Utils.variables.config.EmbedColors.Success,
                    title: lang.ManagementModule.Commands.Reload.Addons[1]
                }))
            } else if (action == 'commands') {
                const msg = await message.channel.send(Utils.Embed({
                    title: lang.ManagementModule.Commands.Reload.Commands[0]
                }))

                await reload(bot, 'commands')

                msg.edit(Utils.Embed({
                    color: Utils.variables.config.EmbedColors.Success,
                    title: lang.ManagementModule.Commands.Reload.Commands[1]
                }))
            } else if (action == 'events') {
                const msg = await message.channel.send(Utils.Embed({
                    title: lang.ManagementModule.Commands.Reload.Events[0]
                }))

                await reload(bot, 'events')

                msg.edit(Utils.Embed({
                    color: Utils.variables.config.EmbedColors.Success,
                    title: lang.ManagementModule.Commands.Reload.Events[1]
                }))
            } else if (action == 'config') {
                const msg = await message.channel.send(Utils.Embed({
                    title: "Reloading..."
                }))

                await reload(bot, 'config')

                msg.edit(Utils.Embed({
                    color: Utils.variables.config.EmbedColors.Success,
                    title: "Reloaded config"
                }))
            } else if (action == 'method') {
                const msg = await message.channel.send(Utils.Embed({
                    title: "Reloading..."
                }))

                await reload(bot, 'methods')

                msg.edit(Utils.Embed({
                    color: Utils.variables.config.EmbedColors.Success,
                    title: "Reloaded methods"
                }))
            } else {
                message.channel.send(Utils.Embed({
                    preset: 'error',
                    description: lang.ManagementModule.Commands.Reload.Errors.UnknownAction.replace(/{action}/g, action)
                }))
            }
        }
    },
    description: "Reload certain aspects of the bot",
    usage: 'reload [addons|commands|events|config]',
    aliases: []
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065