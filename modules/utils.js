const yml = require('./yml.js');
const fs = require('fs');
const chalk = require("chalk");
let config = {};
let lang = {};
let commands = {}
let bot;
(async () => {
    config = await yml('./config.yml');
    lang = await yml("./lang.yml");
    commands = await yml('./commands.yml');
})()

function prefix(code, functionName, caller = undefined) {
    let errorInfo = `${chalk.hex("#757575")("[")}${chalk.hex("#47d7ff")(code)}${chalk.hex("#a1a09f")(" | ")}${chalk.hex("#47d7ff")(functionName)}${caller ? `${chalk.hex("#a1a09f")(" | ")}${chalk.hex("#47d7ff")(caller)}` : ""}${chalk.hex("#757575")("]")}`
    return `${module.exports.errorPrefix}${chalk.bold(errorInfo)}`
}

module.exports = {
    getStartupParameters: () => {
        return process.argv.slice(2).filter(a => a.startsWith("--")).map(a => a.replace(/--/g, ''));
    },
    getLine: (presetLine) => {
        const stacks = (new Error()).stack.split("\n").filter(s => s).map(s => s.trim());
        let line = stacks[presetLine];

        if (!line) {
            line = stacks.find(stack => {
                // If the error is just a normal error
                if (stack.startsWith("at " + __dirname.slice(0, 2))) return true;
                // If the error is coming from a command file
                else if (stack.startsWith("at Object.run") && stack.includes("\\commands\\")) return true;
                // Return false if the stack isn't what we want
                else return false;
            }) || "";
        }

        line.trim();

        return line
            // Remove "at ..."
            .slice(line.indexOf(__dirname.slice(0, 2)), line.length)
            // Only get relative files instead of the whole directory
            .replace(process.cwd(), '')
            // Remove trailing backslash
            .replace(/\)/g, '');
    },
    Discord: require('discord.js'),
    hasRole: function (member, search, notifyIfNotExists = true) {
        if (!search || typeof search !== 'string') {
            console.log(prefix(1, "Utils.hasRole", module.exports.getLine() || "Unknown"), `Invalid input for search:`, search)
            return false;
        }
        if (!member) {
            console.log(prefix(2, "Utils.hasRole", module.exports.getLine() || "Unknown"), `Invalid input for member:`, member)
            return false;
        }
        if (search.name) search = search.name;
        const role = member.guild.roles.cache.find(r => r.name.toLowerCase() == search.toLowerCase() || r.id == search);
        if (!role) {
            if (notifyIfNotExists) console.log(prefix(3, "Utils.hasRole", module.exports.getLine() || "Unknown"), `\n${chalk.gray(">")}          The ${chalk.bold(search.name || search)} role was not found in the ${chalk.bold(member.guild.name)} guild!\n${chalk.gray(">")}          To resolve the issue, create the role in your Discord server.\n${chalk.gray(">")}          `)
            return false;
        }
        if (member.roles.cache.has(role.id)) return true;
        else return false;
    },
    hasPermission: function (member, search) {
        if (!member) {
            console.log(prefix(4, "Utils.hasPermission", module.exports.getLine() || "Unknown"), `Invalid input for member:`, member)
            return false;
        }

        function checkPerms(s) {
            if (member.id == s) return true

            if (member.guild.member(s)) return false

            let role = member.guild.roles.cache.find(r => r.name.toLowerCase() == s.toLowerCase() || r.id == s);

            if (!role) {
                console.log(prefix(6, "Utils.hasPermission", module.exports.getLine() || "Unknown"), `\n${chalk.gray(">")}          The ${chalk.bold(s)} role was not found in the ${chalk.bold(member.guild.name)} guild!\n${chalk.gray(">")}          To resolve the issue, create the role in your Discord server.\n${chalk.gray(">")}          `);
                return false;
            }

            if (commands.Inheritance) {
                if (member.roles.highest.position < role.position) return false
                else return true
            }

            else {
                if (member.roles.cache.has(role.id)) return true
                else return false
            }
        }

        if (typeof search == 'string') {
            if (search == "@everyone") return true
            return checkPerms(search)
        }

        else if (Array.isArray(search)) {
            if (search.includes("@everyone")) return true

            let permission = search.some(s => {
                return checkPerms(s)
            })

            return permission

        }

        else {
            console.log(prefix(5, "Utils.hasPermission", module.exports.getLine() || "Unknown"), `Invalid input for role:`, search);
            return false;
        }

    },
    findRole: function (name, guild, notifyIfNotExists = true) {
        if (!name || typeof name !== 'string') {
            console.log(prefix(7, "Utils.findRole", module.exports.getLine() || "Unknown"), `Invalid input for role:`, name);
            return false;
        }
        if (!guild) {
            console.log(prefix(8, "Utils.findRole", module.exports.getLine() || "Unknown"), `Invalid input for guild:`, guild)
            return false;
        }
        const role = guild.roles.cache.find(r => r.name.toLowerCase() == name.toLowerCase() || r.id == name);
        if (!role) {
            if (notifyIfNotExists) console.log(prefix(9, "Utils.findRole", module.exports.getLine() || "Unknown"), `\n${chalk.gray(">")}          The ${chalk.bold(name)} role was not found in the ${chalk.bold(guild.name)} guild!\n${chalk.gray(">")}          To resolve the issue, create the role in your Discord server.\n${chalk.gray(">")}          `);
            return false;
        }
        return role;
    },
    findChannel: function (name, guild, type = "text", notifyIfNotExists = true) {
        if (!name || typeof name !== "string") {
            console.log(prefix(10, "Utils.findChannel", module.exports.getLine() || "Unknown"), `Invalid input for channel:`, name);
            return false;
        }
        if (!guild) {
            console.log(prefix(11, "Utils.findChannel", module.exports.getLine() || "Unknown"), `Invalid input for guild:`, guild);
            return false;
        }
        if (!['text', 'voice', 'category'].includes(type.toLowerCase())) {
            console.log(prefix(12, "Utils.findChannel", module.exports.getLine() || "Unknown"), `Invalid type of channel:`, type);
            return false;
        }
        const channel = guild.channels.cache.find(c => (c.name.toLowerCase() == name.toLowerCase() || c.id == name) && (type.toLowerCase() == "text" ? ["text", "news"].includes(c.type.toLowerCase()) : c.type.toLowerCase() == type.toLowerCase()));
        if (!channel) {
            if (notifyIfNotExists) console.log(prefix(13, "Utils.findChannel", module.exports.getLine() || "Unknown"), `\n${chalk.gray(">")}          The ${chalk.bold(name)} ${["text", "voice"].includes(type) ? `${type} channel` : "category"} was not found in the ${chalk.bold(guild.name)} guild!\n${chalk.gray(">")}          To resolve the issue, create the ${["text", "voice"].includes(type) ? `${type} channel` : "category"} in your Discord server.\n${chalk.gray(">")}          `);
            return false;
        }
        return channel;
    },
    paste: function (text, paste_site = config.Other.PasteSite || "https://paste.corebot.dev") {
        return new Promise((resolve, reject) => {
            if (!text) reject(prefix(14, "Utils.paste") + ` Invalid text.`);
            require('request-promise')({ uri: paste_site + '/documents', method: 'POST', body: text })
                .then(res => {
                    const json = JSON.parse(res);
                    if (!json || !json.key) reject(prefix(15, "Utils.paste") + ` Invalid response from paste site: ` + res);
                    resolve(paste_site + '/' + json.key);
                })
                .catch(err => {
                    console.log(prefix(16, "Utils.paste"), `The specified paste site is down. Please try again later.`);
                    reject(err);
                })
        })
    },
    hasAdvertisement: function (text, ignoreIfInWhitelist = true) {
        if (!text || typeof text !== 'string') {
            console.log(prefix(17, "Utils.hasAdvertisement"), `Invalid input for text:`, text);
            return false;
        }
        if (config.AntiAdvertisement.Whitelist.Websites.some(site => text.toLowerCase().includes(site.toLowerCase())) && ignoreIfInWhitelist) return false;
        let TLDs = module.exports.variables.TLDs

        let hasLink = TLDs.TLDs.some(TLD => {
            let regexp = new RegExp(`(https:\\/\\/.+|http:\/\/.+|.{2,}\\.${TLD.toLowerCase()}|.{2,}\\.\\s${TLD.toLowerCase()})`)
            return regexp.test(text.toLowerCase())
        }) || TLDs.Domains.some(domain => text.toLowerCase().includes(domain.toLowerCase()))

        return hasLink
        //return /(https?:\/\/)?((([A-Z]|[a-z])+)\.(([A-Z]|[a-z])+))+(\/[^\/\s]+)*/.test(text);
    },
    backup: (files) => {
        return new Promise((resolve, reject) => {
            if (!Array.isArray(files)) reject(prefix(18, "Utils.backup") + ` Files is not an array: ` + files);
            if (!fs.existsSync('./backup/')) fs.mkdirSync('./backup/');
            const date = new Date();
            const folder = date.toLocaleString().replace(/\//g, '-').replace(/,/g, '').replace(/\s/g, '_').replace(/:/g, '-') + '/';
            fs.mkdirSync(`./backup/${folder}`);
            files.forEach(file => {
                fs.readFile('./' + file, (err, data) => {
                    if (err) reject(err);
                    const filename = file.includes('/') ? file.split('/').pop() : file;
                    fs.writeFile('./backup/' + folder + filename, data, function (err) { if (err) reject(err); });
                })
            })
            resolve();
        })
    },
    error: require('./error.js'),
    variables: require('./variables.js'),
    yml: require('./yml.js'),
    Embed: require('./embed.js'),
    waitForResponse: function (userid, channel) {
        return new Promise((resolve, reject) => {
            channel.awaitMessages(m => m.author.id == userid, { max: 1 })
                .then(msgs => {
                    resolve(msgs.first());
                })
                .catch(reject)
        })
    },
    waitForReaction: function (emojis, userids, message) {
        return new Promise((resolve, reject) => {
            if (!Array.isArray(emojis)) emojis = [emojis];
            if (!Array.isArray(userids)) userids = [userids]
            message.awaitReactions((reaction, user) => emojis.includes(reaction.emoji.name) && userids.includes(user.id), { max: 1 })
                .then(reactions => {
                    resolve(reactions.first());
                })
                .catch(reject)
        })
    },
    Database: require('./database.js'),
    setupEmbed(embedSettings) {

        if (embedSettings.configPath && typeof embedSettings.configPath == "object") {
            let Title = embedSettings.title || embedSettings.configPath.Title;
            let Description = embedSettings.description || embedSettings.configPath.Description;
            let Footer = embedSettings.footer || embedSettings.configPath.Footer;
            let FooterAvatarImage = embedSettings.footericon || embedSettings.configPath.FooterIcon;
            let Timestamp = embedSettings.timestamp || embedSettings.configPath.Timestamp;
            let Thumbnail = embedSettings.thumbnail || embedSettings.configPath.Thumbnail;
            let Author = embedSettings.author || embedSettings.configPath.Author;
            let AuthorAvatarImage = embedSettings.authoricon || embedSettings.configPath.AuthorIcon
            let Color = embedSettings.color || embedSettings.configPath.Color || this.variables.config.EmbedColors.Default;
            let Variables = embedSettings.variables;
            let Fields = embedSettings.fields || embedSettings.configPath.Fields;
            let Image = embedSettings.image || embedSettings.configPath.Image;
            let URL = embedSettings.url || embedSettings.configPath.URL;

            let fields = [];

            if (Array.isArray(Color)) Color = Color[Math.floor(Math.random() * Color.length)];
            if (Array.isArray(Description)) Description = Description[Math.floor(Math.random() * Description.length)];

            if (Variables && typeof Variables === 'object') {
                Variables.forEach(v => {
                    if (typeof Title === 'string') Title = Title.replace(v.searchFor, v.replaceWith);
                    if (typeof Description === 'string') Description = Description.replace(v.searchFor, v.replaceWith);
                    if (typeof Footer === 'string') Footer = Footer.replace(v.searchFor, v.replaceWith);
                    if (typeof FooterAvatarImage === 'string') FooterAvatarImage = FooterAvatarImage.replace(v.searchFor, v.replaceWith);
                    if (typeof Thumbnail === 'string') Thumbnail = Thumbnail.replace(v.searchFor, v.replaceWith);
                    if (typeof Author === 'string') Author = Author.replace(v.searchFor, v.replaceWith);
                    if (typeof AuthorAvatarImage === 'string') AuthorAvatarImage = AuthorAvatarImage.replace(v.searchFor, v.replaceWith);
                    if (typeof Image === 'string') Image = Image.replace(v.searchFor, v.replaceWith);
                    if (typeof URL === 'string') URL = URL.replace(v.searchFor, v.replaceWith);
                })
            }

            if (Fields) {
                Fields.forEach(async (field, i) => {
                    let newField = {
                        name: field.name || field.Name,
                        value: field.value || field.Value,
                        inline: !!field.inline || !!field.Inline
                    };

                    if (Variables && typeof Variables === 'object') {
                        Variables.forEach(v => {
                            newField.name = newField.name.replace(v.searchFor, v.replaceWith);
                            newField.value = newField.value.replace(v.searchFor, v.replaceWith);
                        })
                    }
                    fields.push(newField)
                });
            }

            let embed = new this.Discord.MessageEmbed()

            if (!Title && !Author && !Description && (!Fields || Fields.length < 1)) {
                embed.setTitle('Error')
                embed.setDescription('Not enough embed settings provided to build embed')
                return embed;
            }

            if (Title) embed.setTitle(Title);
            if (Author) embed.setAuthor(Author);
            if (Description) embed.setDescription(Description);
            if (Color) embed.setColor(Color)
            if (Footer) embed.setFooter(Footer);
            if (Timestamp == true) embed.setTimestamp();
            if (Timestamp && Timestamp !== true && new Date(Timestamp)) embed.setTimestamp(new Date(Timestamp));
            if (FooterAvatarImage && Footer) embed.setFooter(Footer, FooterAvatarImage);
            if (AuthorAvatarImage && Author) embed.setAuthor(Author, AuthorAvatarImage);
            if (Thumbnail) embed.setThumbnail(Thumbnail);
            if (Fields && Fields.length > 0) {
                fields.forEach(field => {
                    embed.addField(field.name, field.value, field.inline)
                })
            }
            if (Image) embed.setImage(Image);
            if (URL) embed.setURL(URL);

            return embed;
        } else {
            return console.log(prefix(19, "Utils.setUpEmbed"), `Invalid input for configPath:`, embedSettings.configPath);
        }
    },
    transcriptMessage: function (message, ticket = true) {
        const type = this.variables.db.type;
        const isEmbed = message.embeds.length > 0;

        const embed = {
            fields: [],
            description: "",
            title: "",
            color: ""
        }

        if (isEmbed) {
            embed.fields = message.embeds[0].fields || [];
            embed.description = message.embeds[0].description || '';
            embed.title = message.embeds[0].title || '';
            embed.color = message.embeds[0].hexColor || "#0023b0";
        }

        if (ticket) {
            if (type === 'sqlite') {
                if (isEmbed) {
                    this.variables.db.sqlite.database.prepare('INSERT INTO ticketmessages(message, author, authorAvatar, authorTag, created_at, embed_title, embed_description, embed_color, attachment, content, ticket) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(message.id, message.author.id, message.author.displayAvatarURL({ dynamic: true }), message.author.tag, message.createdAt.getTime(), embed.title, embed.description, embed.color, message.attachments.size > 0 ? message.attachments.first().url : undefined, message.content, message.channel.id)

                    embed.fields.forEach(field => {
                        module.exports.variables.db.sqlite.database.prepare('INSERT INTO ticketmessages_embed_fields(message, name, value) VALUES(?, ?, ?)').run(message.id, field.name, field.value)
                    })
                } else {
                    this.variables.db.sqlite.database.prepare('INSERT INTO ticketmessages(message, author, authorAvatar, authorTag, created_at, embed_title, embed_description, embed_color, attachment, content, ticket) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(message.id, message.author.id, message.author.displayAvatarURL({ dynamic: true }), message.author.tag, message.createdAt.getTime(), undefined, undefined, undefined, message.attachments.size > 0 ? message.attachments.first().url : undefined, message.content, message.channel.id)
                }
            } else if (type === 'mysql') {
                if (isEmbed) {
                    this.variables.db.mysql.database.query('INSERT INTO ticketmessages(message, author, authorAvatar, authorTag, created_at, embed_title, embed_description, embed_color, attachment, content, ticket) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [message.id, message.author.id, message.author.displayAvatarURL({ dynamic: true }), message.author.tag, message.createdAt.getTime(), embed.title, embed.description, embed.color, message.attachments.size > 0 ? message.attachments.first().url : undefined, message.content, message.channel.id], function (err) {
                        if (err) console.log(err);

                        embed.fields.forEach(field => {
                            module.exports.variables.db.mysql.database.query('INSERT INTO ticketmessages_embed_fields(message, name, value) VALUES(?, ?, ?)', [message.id, field.name, field.value], function (err) {
                                if (err) console.log(err);
                            })
                        })
                    })
                } else {
                    this.variables.db.mysql.database.query('INSERT INTO ticketmessages(message, author, authorAvatar, authorTag, created_at, embed_title, embed_description, embed_color, attachment, content, ticket) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [message.id, message.author.id, message.author.displayAvatarURL({ dynamic: true }), message.author.tag, message.createdAt.getTime(), undefined, undefined, undefined, message.attachments.size > 0 ? message.attachments.first().url : undefined, message.content, message.channel.id], function (err) {
                        if (err) console.log(err);
                    })
                }
            }
        } else {
            if (type === 'sqlite') {
                if (isEmbed) {
                    this.variables.db.sqlite.database.prepare('INSERT INTO applicationmessages(message, author, authorAvatar, authorTag, created_at, embed_title, embed_description, embed_color, attachment, content, application) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(message.id, message.author.id, message.author.displayAvatarURL({ dynamic: true }), message.author.tag, message.createdAt.getTime(), embed.title, embed.description, embed.color, message.attachments.size > 0 ? message.attachments.first().url : undefined, message.content, message.channel.id)

                    embed.fields.forEach(field => {
                        module.exports.variables.db.sqlite.database.prepare('INSERT INTO applicationmessages_embed_fields(message, name, value) VALUES(?, ?, ?)').run(message.id, field.name, field.value)
                    })
                } else {
                    this.variables.db.sqlite.database.prepare('INSERT INTO applicationmessages(message, author, authorAvatar, authorTag, created_at, embed_title, embed_description, embed_color, attachment, content, application) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(message.id, message.author.id, message.author.displayAvatarURL({ dynamic: true }), message.author.tag, message.createdAt.getTime(), undefined, undefined, undefined, message.attachments.size > 0 ? message.attachments.first().url : undefined, message.content, message.channel.id)
                }
            } else if (type === 'mysql') {
                if (isEmbed) {
                    this.variables.db.mysql.database.query('INSERT INTO applicationmessages(message, author, authorAvatar, authorTag, created_at, embed_title, embed_description, embed_color, attachment, content, application) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [message.id, message.author.id, message.author.displayAvatarURL({ dynamic: true }), message.author.tag, message.createdAt.getTime(), embed.title, embed.description, embed.color, message.attachments.size > 0 ? message.attachments.first().url : undefined, message.content, message.channel.id], function (err) {
                        if (err) console.log(err);

                        embed.fields.forEach(field => {
                            module.exports.variables.db.mysql.database.query('INSERT INTO applicationmessages_embed_fields(message, name, value) VALUES(?, ?, ?)', [message.id, field.name, field.value], function (err) {
                                if (err) console.log(err);
                            })
                        })
                    })
                } else {
                    this.variables.db.mysql.database.query('INSERT INTO applicationmessages(message, author, authorAvatar, authorTag, created_at, embed_title, embed_description, embed_color, attachment, content, application) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [message.id, message.author.id, message.author.displayAvatarURL({ dynamic: true }), message.author.tag, message.createdAt.getTime(), undefined, undefined, undefined, message.attachments.size > 0 ? message.attachments.first().url : undefined, message.content, message.channel.id], function (err) {
                        if (err) console.log(err);
                    })
                }
            }
        }
    },
    checkBan: async function (guild, user) {
        if ([guild, user].some(a => !a)) return console.log(prefix(20, "Utils.checkBan"), `Invalid inputs:`, [guild, user].map(a => !!a).join(', '));
        return !!(await guild.fetchBans()).find(b => b.user.id == user);
    },
    ResolveUser: function (message, argument = 0, fullText = false) {
        const args = message.content.split(" ");
        args.shift();
        const text = fullText ? message.content : (args[argument] || '');
        return message.guild.members.cache.find(m => m.user.tag.toLowerCase() == text.toLowerCase() || m.displayName.toLowerCase() == text.toLowerCase() || m.id == text.replace(/([<@]|[>])/g, '')) || message.mentions.members.first();
    },
    ResolveChannel: (message, argument = 0, fullText = false, useMentions = true) => {
        const args = message.content.split(" ");
        args.shift();
        const text = fullText ? message.content : (args[argument] || '');

        return message.guild.channels.cache.find(c => c.name.toLowerCase() == text.toLowerCase() || c.id == text.replace(/([<#]|[>])/g, '')) || (useMentions ? message.mentions.channels.first() : false);
    },
    getMMDDYYYY(separator = '-', time = Date.now()) {
        const date = new Date(time);
        return [date.getMonth() + 1, date.getDate(), date.getFullYear()].join(separator);
    },
    getEmoji: function (number) {
        if (number == 1) return "\u0031\u20E3";
        if (number == 2) return "\u0032\u20E3";
        if (number == 3) return "\u0033\u20E3";
        if (number == 4) return "\u0034\u20E3";
        if (number == 5) return "\u0035\u20E3";
        if (number == 6) return "\u0036\u20E3";
        if (number == 7) return "\u0037\u20E3";
        if (number == 8) return "\u0038\u20E3";
        if (number == 9) return "\u0039\u20E3";
        if (number == 10) return "\uD83D\uDD1F";
    },
    getValidInvites(guild) {
        return new Promise((resolve, reject) => {
            guild.fetchInvites()
                .then(invites => {
                    resolve(invites.map(i => {
                        return {
                            code: i.code,
                            channel: i.channel,
                            uses: i.uses ? i.uses : 0,
                            inviter: i.inviter ? i.inviter : guild.members.cache.get(bot.id)
                        }
                    }))
                })
                .catch(reject)
        })
    },
    CheckCommand(args, permission) {
        /*
            ARGS TEMPLATE:

            Example for tempban
            [
                {
                    name: "target",
                    type: "User"
                },
                {
                    name: "time",
                    type: "Time"
                }
            ]
        */

    },
    getTimeDifference(date1, date2) {
        let d1 = new Date(date1)
        let d2 = new Date(date2)
        var msec = d2 - d1;
        let secs = Math.floor(msec / 1000);
        var mins = Math.floor(secs / 60);
        var hrs = Math.floor(mins / 60);
        var days = Math.floor(hrs / 24);
        let result = []

        secs = Math.abs(secs % 60)
        mins = Math.abs(mins % 60);
        hrs = Math.abs(hrs % 24);
        days = Math.abs(days % 365);

        if (days !== 0) days == 1 ? result.push("" + lang.Other.Time.Day.replace(/{days}/g, days)) : result.push("" + lang.Other.Time.Days.replace(/{days}/g, days))
        if (hrs !== 0) hrs == 1 ? result.push("" + lang.Other.Time.Hour.replace(/{hours}/g, hrs)) : result.push("" + lang.Other.Time.Hours.replace(/{hours}/g, hrs))
        if (mins !== 0) mins == 1 ? result.push("" + lang.Other.Time.Minute.replace(/{minutes}/g, mins)) : result.push("" + lang.Other.Time.Minutes.replace(/{minutes}/g, mins))
        if (secs !== 0) secs == 1 ? result.push("" + lang.Other.Time.Second.replace(/{seconds}/g, secs)) : result.push("" + lang.Other.Time.Seconds.replace(/{seconds}/g, secs))

        if (result.length == 1 && result[0].endsWith(lang.Other.Time.Seconds.replace(/{seconds}/g, ''))) {
            return lang.Other.Time.LessThan + result[0]
        } else {
            return lang.Other.Time.About + result.join(" ");
        }

        /*let distance = new Date(date1) - new Date(date2).getTime();
        let days = Math.floor(distance / (1000 * 60 * 60 * 24));
        let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((distance % (1000 * 60)) / 1000);

        return hours + "h " + minutes + "m and " + seconds + "s"*/
    },
    getStatusPlaceholders(status) {
        if (!status || typeof status !== "string") return "";

        bot = module.exports.variables.bot

        const guild = bot.guilds.cache.first();

        if (guild) return status
            .replace(/{tickets}/g, guild.channels.cache.filter(c => /.+-[0-9]{4}/.test(c.name)).size)
            .replace(/{users}/g, guild.memberCount)
            .replace(/{total-online-users}/g, guild.members.cache.filter(member => member.presence.status !== "offline").size)
            .replace(/{total-online-humans}/g, guild.members.cache.filter(member => member.presence.status !== "offline" && !member.user.bot).size)
            .replace(/{total-online-bots}/g, guild.members.cache.filter(member => member.presence.status !== "offline" && member.user.bot).size)
            .replace(/{humans}/g, guild.members.cache.filter(member => !member.user.bot).size)
            .replace(/{bots}/g, guild.members.cache.filter(member => member.user.bot).size)
    },
    asyncForEach: async function asyncForEach(array, callback) {
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array);
        }
    },
    DDHHMMSSfromMS(ms) {
        let secs = ms / 1000
        const days = ~~(secs / 86400);
        secs -= days * 86400;
        const hours = ~~(secs / 3600);
        secs -= hours * 3600;
        const minutes = ~~(secs / 60);
        secs -= minutes * 60;
        let total = [];

        if (days > 0)
            total.push(~~days + " days");
        if (hours > 0)
            total.push(~~hours + " hrs")
        if (minutes > 0)
            total.push(~~minutes + " mins")
        if (secs > 0)
            total.push(~~secs + " secs")
        if ([~~days, ~~hours, ~~minutes, ~~secs].every(time => time == 0)) total.push("0 secs");
        return total.join(", ");
    },
    color: {
        "Reset": "\x1b[0m",
        "Bright": "\x1b[1m",
        "Dim": "\x1b[2m",
        "Underscore": "\x1b[4m",
        "Blink": "\x1b[5m",
        "Reverse": "\x1b[7m",
        "Hidden": "\x1b[8m",
        "FgBlack": "\x1b[30m",
        "FgRed": "\x1b[31m",
        "FgGreen": "\x1b[32m",
        "FgYellow": "\x1b[33m",
        "FgBlue": "\x1b[34m",
        "FgMagenta": "\x1b[35m",
        "FgCyan": "\x1b[36m",
        "FgWhite": "\x1b[37m",
        "BgBlack": "\x1b[40m",
        "BgRed": "\x1b[41m",
        "BgGreen": "\x1b[42m",
        "BgYellow": "\x1b[43m",
        "BgBlue": "\x1b[44m",
        "BgMagenta": "\x1b[45m",
        "BgCyan": "\x1b[46m",
        "BgWhite": "\x1b[47m",
    },
    infoPrefix: chalk.hex("#57ff6b").bold("[INFO] "),
    warningPrefix: chalk.hex("#ffa040").bold("[WARNING] "),
    errorPrefix: chalk.hex("#ff5e5e").bold("[ERROR] "),
    backupPrefix: chalk.hex("#61f9ff").bold("[BACKUP] "),
    fixEmbed: async function fixEmbed(embed) {

        if (embed.embed.fields) {
            embed.embed.fields.forEach(async oldField => {

                async function fixField(field) {
                    let newFields = [];
                    let firstField = true;

                    if (field.value.length <= 1024) {
                        return {
                            name: field.name,
                            value: field.value,
                            inline: field.inline ? true : false
                        };
                    }

                    while (field.vaalue.length > 1024) {
                        if (firstField) {
                            fields.push({
                                name: field.name,
                                value: field.value.substring(0, 1024),
                                inline: field.inline ? true : false
                            });
                            firstField = false;
                        } else {
                            fields.push({
                                name: '\u200B',
                                value: field.value.substring(0, 1024),
                                inline: field.inline ? true : false
                            });
                        }
                        field.value = field.value.slice(1024);
                    }

                    return newFields
                }

                await fixField(oldField).then(fields => {
                    embed.embed.fields.splice(embed.embed.fields.indexOf(oldField) + 1, 0, ...fields)
                })

            })
        }

        return embed;
    },
    delay: async function (seconds) {
        let start = Date.now();
        let end = start;
        while (end < start + (seconds * 1000)) {
            end = Date.now();
        }

        return true;
    },
    userVariables: function (user, prefix) {
        return [
            { searchFor: new RegExp(`{${prefix}-id}`, 'g'), replaceWith: user.id },
            { searchFor: new RegExp(`{${prefix}-displayname}`, 'g'), replaceWith: user.displayName },
            { searchFor: new RegExp(`{${prefix}-username}`, 'g'), replaceWith: user.user.username },
            { searchFor: new RegExp(`{${prefix}-tag}`, 'g'), replaceWith: user.user.tag },
            { searchFor: new RegExp(`{${prefix}-mention}`, 'g'), replaceWith: '<@' + user.id + '>' },
            { searchFor: new RegExp(`{${prefix}-pfp}`, 'g'), replaceWith: user.user.displayAvatarURL({ dynamic: true }) },
        ]
    },
    getMultiplier(member) {
        if (config.Coins.Multipliers.Enabled) {
            let multipliers = []

            Object.keys(config.Coins.Multipliers.Roles).forEach(role => {
                if (module.exports.hasRole(member, role)) multipliers.push(config.Coins.Multipliers.Roles[role])
            })

            if (multipliers.length > 0) return Math.max(...multipliers)
            else return 1
        } else return 1
    },
    getOpenTickets: async guild => {
        if (!guild || !guild.id) return console.log(prefix(21, "Utils.getOpenTickets"), `Invalid input for guild:`, guild)

        let tickets = await module.exports.variables.db.get.getTickets();
        tickets = tickets.filter(ticket => ticket.guild == guild.id).map(ticket => ticket.channel_id);

        return guild.channels.cache.filter(channel => tickets.includes(channel.id));
    },
    getOpenApplications: async guild => {
        if (!guild || !guild.id) return console.log(prefix(22, "Utils.getOpenApplications"), `Invalid input for guild:` + guild)

        let applications = await module.exports.variables.db.get.getApplications();
        applications = applications.filter(application => application.guild == guild.id).map(application => application.channel_id);

        return guild.channels.cache.filter(channel => applications.includes(channel.id));
    },
    updateInviteCache: async bot => {
        return new Promise(async resolve => {
            let cache = {};
            bot.guilds.cache.array().forEach((g, i) => {
                g.fetchInvites().then(guildInvites => {
                    cache[g.id] = guildInvites;
                    if (i >= bot.guilds.cache.size - 1) set();
                });
            });

            function set() {
                module.exports.variables.set("invites", cache);
                resolve();
            }
        })
    }
}
// 239232   8501   2161065    ION__%%   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065