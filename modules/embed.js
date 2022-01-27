const { RichEmbed } = require('discord.js');
const yml = require('./yml.js');
let Theme_Color = parseInt("#fffff", 16);
let Error_Color = parseInt("#f52c2c", 16);
let Config = {};
let lang = {};
(async () => {
    const config = await yml('./config.yml');
    Config = config;
    Theme_Color = parseInt(config.EmbedColors.Default.replace(/#/g, ''), 16);
    Error_Color = parseInt(config.EmbedColors.Error.replace(/#/g, ''), 16);
    lang = await yml("./lang.yml");
})()
module.exports = function (embedOptions) {
    if (embedOptions.preset) {
        switch (embedOptions.preset) {
            case 'nopermission':
                return {
                    embed: {
                        color: Error_Color,
                        title: lang.EmbedPresets.NoPerms.Title,
                        description: format(lang.EmbedPresets.NoPerms.Description, 2048),
                        timestamp: new Date()
                    }
                }
            case 'invalidargs':
                return {
                    embed: {
                        color: Error_Color,
                        title: lang.EmbedPresets.InvalidArgs.Title,
                        description: format(lang.EmbedPresets.InvalidArgs.Description.replace(/{usage}/g, Config.Prefix + embedOptions.usage), 2048),
                        timestamp: new Date()
                    }
                }
            case 'error':
                if (embedOptions.description && !embedOptions.usage) return {
                    embed: {
                        color: Error_Color,
                        title: embedOptions.description,
                    }
                }
                if (embedOptions.description && embedOptions.usage) return {
                    embed: {
                        color: Error_Color,
                        title: embedOptions.description,
                        description: format(lang.EmbedPresets.Error.Descriptions[1].replace(/{usage}/g, Config.Prefix + embedOptions.usage), 2048)
                    }
                }
                return {
                    embed: {
                        color: Error_Color,
                        title: lang.EmbedPresets.Error.Title,
                        description: format(lang.EmbedPresets.Error.Descriptions[0], 2048)
                    }
                }
            case 'console':
                return {
                    embed: {
                        color: Error_Color,
                        title: lang.EmbedPresets.Console.Title
                    }
                }
            default:
                return {
                    embed: {
                        color: Theme_Color,
                        title: lang.EmbedPresets.Error.Title,
                        description: format(lang.EmbedPresets.Error.Descriptions[0], 2048)
                    }
                }
        }
    } else {
        const embed = embedOptions;
        if (embed.color) embed.color = parseInt(embed.color.replace(/#/g, ''), 16);
        else embed.color = Theme_Color;
        if (embed.footer) {
            const footer = embed.footer;
            if (typeof footer == "string")
                embed.footer = { text: footer };
            else if (embed.footer.icon)
                embed.footer = { text: footer.text, icon_url: footer.icon }
        }
        if (embed.author) {
            const author = embed.author;
            if (typeof author == "string")
                embed.author = { name: author };
            if (embed.author.icon)
                embed.author = { name: author.text, icon_url: embed.author.icon };
        }
        if (embed.thumbnail)
            embed.thumbnail = { url: embed.thumbnail };
        if (embed.image)
            embed.image = { url: embed.image };
        if (embed.description)
            embed.description = format(embed.description, 2048);
        if (embed.fields)
            embed.fields = embed.fields.map(field => {
                let f = { name: format(field.name, 1024), value: format(field.value, 1024), inline: (field.inline) ? true : false }
                return f;
            });
        return { embed: embed };
    }

}

const format = (text, max) => {
    return text
        .toString()
        .slice(0, max);
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065