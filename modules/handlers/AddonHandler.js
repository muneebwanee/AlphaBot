const Utils = require('../utils.js');
const fs = require('fs');

module.exports = {
    addons: [],
    unload(addon_name) {
        return new Promise((resolve, reject) => {
            const addon = addons.find(a => a.name.toLowerCase() == addon_name.toLowerCase());

            if (!addon) return reject("That addon does not exist");
            if (!addon.loaded) return reject("That addon is already unloaded");

            this.addons.find(a => a.name.toLowerCase() == addon_name.toLowerCase()).loaded = false;
            delete require.cache[require.resolve('../../addons/' + addon.name)];

            resolve();
        })
    },
    load(addon_name) {
        return new Promise((resolve, reject) => {
            const addon = addons.find(a => a.name.toLowerCase() == addon_name.toLowerCase());

            if (!addon) return reject("That addon does not exist");
            if (addon.loaded) return reject("That addon is already loaded");

            this.addons.find(a => a.name.toLowerCase() == addon_name.toLowerCase()).loaded = true;
            addon.run();

            resolve();
        })
    },
    set(addon) {
        if (!addon.name) return console.log(Utils.errorPrefix + "No addon name was supplied to AddonHandler#set");
        if (!addon.run) return console.log(Utils.errorPrefix + "No addon function was supplied to AddonHandler#set");

        addon.run(this.bot);

        const CommandHandler = require('./CommandHandler');
        const EventHandler = require('./EventHandler');

        this.addons.push({
            name: addon.name,
            run: addon.run,
            commands: CommandHandler.commands.filter(command => command.addonName ? command.addonName.toLowerCase() == addon.name.toLowerCase() : false),
            events: EventHandler.events.filter(event => event.addonName ? event.addonName.toLowerCase() == addon.name.toLowerCase() : false),
            loaded: true
        })

        if (!["music", "ultimatemusic"].includes(addon.name)) console.log(Utils.infoPrefix + addon.name + " addon loaded.");
    },
    init: function async(bot) {
        this.bot = bot;

        fs.readdir('./addons', async (err, files) => {
            if (err) {
                if (err.message.startsWith("ENOENT: no such file or directory, scandir")) {
                    files = [];
                    fs.mkdirSync("./addons");
                }
                else throw err;
            }

            files
                .filter(f => f.endsWith(".js"))
                .forEach(addon => {
                    this.set({
                        name: addon.replace(/\.js/, ""),
                        run: require('../../addons/' + addon)
                    })
                })

            return module.exports;
        })
    }
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065