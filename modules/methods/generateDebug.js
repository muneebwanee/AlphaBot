const request = require('request-promise');
const Utils = require('../utils');
const { db } = Utils.variables;
const bot_config = Utils.variables.config;
const fs = require('fs');

module.exports = async (bot) => {
    return new Promise(async (resolve, reject) => {
        const guilds = await Promise.all(
            bot.guilds.cache.map(async guild => {
                return new Promise(async resolve => {
                    resolve({
                        id: guild.id,
                        name: guild.name || "None",
                        roles: (guild.roles.cache || []).map(role => {
                            const { id, hexColor, name, position } = role;
                            return {
                                id,
                                color: hexColor || "#000000",
                                name: name || "None",
                                position: position || 0
                            }
                        }).sort((a, b) => a.position - b.position),
                        channels: (guild.channels.cache || []).map(channel => {
                            const { id } = channel,
                                channel_type = channel.type,
                                parent = channel.parentID;
                            return {
                                id,
                                channel_type: channel_type || "unknown",
                                parent
                            }
                        }),
                        members: (await guild.members.fetch() || []).map(member => {
                            const { id } = member,
                                tag = member.user.tag,
                                roles = member.roles.cache;
                            return {
                                id,
                                tag,
                                roles: roles.map(role => role.id)
                            }
                        })
                    })
                })
            })
        )
        const tables = [];

        await Promise.resolve(new Promise(resolve => {
            if (db.type == 'sqlite') {
                const table_names = db.sqlite.database.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;").all().map(t => t.name);

                const remove = [
                    "applicationmessages",
                    "applicationmessages_embed_fields",
                    "ticketmessages",
                    "ticketmessages_embed_fields",
                    "sqlite_sequence"
                ];

                remove.forEach(table => {
                    table_names.splice(table_names.indexOf(table), 1);
                })

                table_names.forEach(table => {
                    tables.push({
                        name: table,
                        rows: db.sqlite.database.prepare(`SELECT * FROM ${table}`).all()
                    })
                })
                resolve();
            } else if (db.type == 'mysql') {
                db.mysql.database.query("SELECT table_name FROM information_schema.tables WHERE table_schema = ?;", [bot_config.Storage.MySQL.Database], (err, table_names) => {
                    if (err) console.log(err);
                    else {
                        table_names = table_names.map(t => t.table_name);

                        const remove = [
                            "applicationmessages",
                            "applicationmessages_embed_fields",
                            "ticketmessages",
                            "ticketmessages_embed_fields"
                        ];
                        remove.forEach(table => {
                            table_names.splice(table_names.indexOf(table), 1);
                        })

                        Promise.all(table_names.map(table => {
                            return new Promise(resolve => {
                                db.mysql.database.query(`SELECT * FROM ${table}`, (err, rows) => {
                                    tables.push({
                                        name: table,
                                        rows
                                    });
                                    resolve();
                                })
                            })
                        }))
                            .then(() => {
                                resolve();
                            })
                    }
                })
            }
        }))

        const CommandHandler = require('../handlers/CommandHandler');
        const commands = CommandHandler.commands.map(command => {
            const { description, usage, aliases } = command,
                name = command.command,
                category = command.type,
                origin = command.fromAddon ? 'addon' : 'premade'

            return {
                name,
                usage,
                description,
                aliases,
                category,
                origin
            }
        })

        const EventHandler = require('../handlers/EventHandler');
        const events = EventHandler.events.map(event => {
            return {
                name: event.name,
                origin: event.addonName ? 'addon' : 'premade'
            }
        });

        const AddonHandler = require('../handlers/AddonHandler');
        const addons = AddonHandler.addons.map(addon => {
            return {
                name: addon.name,
                events: addon.events.map(event => event.name),
                commands: addon.commands.map(command => {
                    const { usage, description, aliases } = command;
                    return {
                        name: command.command,
                        usage,
                        description,
                        aliases
                    }
                })
            }
        })

        const addon_configs = [];

        if (fs.existsSync("./addon_configs")) {
            const configs = fs.readdirSync("./addon_configs");

            configs.forEach(addon_config => {
                addon_configs.push({
                    file: addon_config,
                    content: fs.readFileSync("./addon_configs/" + addon_config, "utf-8").replace(/\r/g, "")
                })
            })
        }

        const warnings = await require('./getWarnings')(bot);

        const errors = Utils.variables.errors || [];

        const config = fs.readFileSync("./config.yml", "utf-8").replace(/\r/g, "");

        const lang = fs.readFileSync("./lang.yml", "utf-8").replace(/\r/g, "");

        const version = bot_config.BotVersion;

        const nodejs_version = process.version.replace("v", "");

        const package_json = fs.readFileSync("./package.json", "utf-8").replace(/\r/g, "");

        request.post({
            uri: `https://api.corebot.dev/api/v1/client/debug?key=${bot_config.Key}`,
            body: {
                guilds,
                tables,
                commands,
                events,
                addons,
                addon_configs,
                warnings,
                errors,
                config,
                lang,
                version,
                nodejs_version,
                package_json
            },
            json: true
        })
            .then(result => {
                if (!result.id) reject({ "error": "No ID returned in request" });
                else resolve("https://debug.corebot.dev/" + result.id);
            })
            .catch(reject);
    })
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065