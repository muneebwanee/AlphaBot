module.exports = async (bot, type) => {

    const CommandHandler = require('../handlers/CommandHandler');
    const EventHandler = require('../handlers/EventHandler');
    const Utils = require("../utils");
    const fs = require("fs");

    async function reloadCommands() {
        CommandHandler.commands.forEach(c => {
            try {
                delete require.cache[require.resolve('../../commands/' + c.type + '/' + c.command + '.js')]
            } catch (err) {
                // Command doesn't exist (it's an addon)
            }
        })
        CommandHandler.commands = [];
        CommandHandler.init(bot);
    }

    async function reloadEvents() {
        EventHandler.events.forEach(e => {
            try {
                bot.removeListener(e.name, e.call);
                delete require.cache[require.resolve('../../events/' + e.name + '.js')];
            } catch (err) {
                // Event doesn't exist (it's an addon)
            }
        })
        EventHandler.events = [];
        EventHandler.init(bot);
    }

    async function reloadAddons() {
        const AddonHandler = require('../handlers/AddonHandler');
        const addons = AddonHandler.addons;
        addons.forEach(addon => {
            delete require.cache[require.resolve('../../addons/' + addon.name)];
        })

        AddonHandler.addons = [];
        AddonHandler.init(bot);
    }

    async function reloadConfig() {
        const updatedConfig = await require('../yml')('./config.yml');
        Utils.variables.set('config', updatedConfig);

        const updatedLang = await require('../yml')('./lang.yml');
        Utils.variables.set('lang', updatedLang);

        const updatedCommands = await require('../yml')('./commands.yml');
        Utils.variables.set('commands', updatedCommands);

        const updatedEmbeds = await require('../yml')('./embeds.yml');
        Utils.variables.set('embeds', updatedEmbeds);

        const updatedTLDs = await require('../yml')('./TLDs.yml');
        Utils.variables.set('TLDs', updatedTLDs);
    }

    async function reloadMethods() {
        fs.readdir("./modules/methods", (err, files) => {

            if (err) return console.log(err);
            files.forEach(method => {
                delete require.cache[require.resolve('./' + method)];
                require('./' + method)
            })

            console.log(Utils.infoPrefix + "Reloaded all methods")
        })
    }

    if (type == 'addons') return reloadAddons()
    else if (type == 'config') return reloadConfig();
    else if (type == 'commands') return reloadCommands();
    else if (type == 'events') return reloadEvents();
    else if (type == 'methods') return reloadMethods();
    else if (!type || type == 'all') {
        await Promise.all([
            reloadConfig(),
            reloadAddons(),
            reloadCommands(),
            reloadEvents(),
            reloadMethods()
        ])
        return;
    }

    resolve()
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065