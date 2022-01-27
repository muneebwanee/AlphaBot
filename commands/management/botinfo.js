const Utils = require("../../modules/utils.js");
const { Embed, Discord } = Utils;
const { config, lang } = Utils.variables;

const os_utils = require('os-utils');

module.exports = {
    name: 'botinfo',
    run: async (bot, message, args) => {
        const packages = require('../../package.json');

        const os = process.platform;

        let os_name = "";
        if (os == "win32")
            os_name = "Windows"
        else if (os == "darwin")
            os_name = "MacOS"
        else os_name = os.charAt(0).toUpperCase() + os.slice(1);

        const totalMemory = (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(0);
        const usedMemory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(0);

        const usedMemoryPercent = usedMemory / totalMemory * 100;
    
        const memoryEmoji = usedMemoryPercent < 50 ? ":green_circle:" : (usedMemoryPercent < 90 ? ":yellow_circle:" : ":red_circle:");

        const embed = Embed({
            title: bot.user.username,
            fields: [
                {
                    name: "Corebot Version",
                    value: config.BotVersion,
                    inline: true
                },
                {
                    name: "Discord.js Version",
                    value: packages.dependencies['discord.js'],
                    inline: true
                },
                {
                    name: "Node.js Version",
                    value: process.version,
                    inline: true
                },
                {
                    name: "Operating System",
                    value: os_name,
                    inline: true
                },
                {
                    name: "Memory Usage",
                    value: `${memoryEmoji} **${usedMemory}**/**${totalMemory}mb**`,
                    inline: true    
                },
                {
                    name: "Servers",
                    value: bot.guilds.cache.size,
                    inline: true
                },
                {
                    name: "Users",
                    value: bot.users.cache.size,
                    inline: true
                }
            ]
        })

        message.channel.send(embed);
    },
    description: "View info about Corebot",
    usage: "botinfo",
    aliases: [

    ]
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065