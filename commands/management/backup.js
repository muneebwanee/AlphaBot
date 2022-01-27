const Utils = require('../../modules/utils.js');
const fs = require('fs');
const {Discord, Embed} = Utils;

function convertPermissions(number) {
    return new Discord.Permissions(number).toArray();
}

module.exports = {
    name: "backup",
    run: async (bot, message, args) => {
        let type = args[0] ? args[0].toLowerCase() : undefined
        let Database = Utils.variables.db;

        async function save(restore = false) {
            const tickets = await Database.get.getTickets();
            const experience = await Database.get.getExperience();
            const coins = await Database.get.getCoins();
            const giveaways = await Database.get.getGiveaways();
            const data = {
                serverID: message.guild.id,
                roles: message.guild.roles.cache
                    .filter(r => r.id !== message.guild.id)
                    .map(r => {
                        return {
                            id: r.id,
                            name: r.name,
                            hoisted: r.hoisted,
                            position: r.calculatedPosition,
                            color: r.color,
                            hexColor: r.hexColor,
                            mentionable: r.mentionable,
                            permissions: r.permissions,
                            hoisted: r.hoist
                        }
                    }),
                channels: message.guild.channels.cache.map(c => {
                    return {
                        id: c.id,
                        name: c.name,
                        parent: c.parent ? c.parent.name : null,
                        type: c.type,
                        permissions: c.permissionOverwrites.map(p => {
                            return {
                                id: p.id,
                                type: p.type,
                                denied: convertPermissions(p.deny),
                                allowed: convertPermissions(p.allow)
                            }
                        })
                    }
                }),
                emojis: message.guild.emojis.cache.map(e => {
                    return {
                        id: e.id,
                        name: e.name,
                        url: e.url
                    }
                }),
                members: message.guild.members.cache.map(m => {
                    return {
                        id: m.user.id,
                        username: m.user.username,
                        tag: m.user.tag,
                        roles: m.roles.cache.map(r => {
                            return {
                                id: r.id,
                                name: r.name
                            }
                        })
                    }
                }),
                tickets: tickets,
                experience: experience,
                coins: coins,
                giveaways: giveaways
            }

            fs.exists('./server_backups', exists => {

                async function create_backup() {
                    const file = './server_backups/' + (restore ? "restore_" : "") + Date.now() + '.json';
                    fs.writeFileSync(file, JSON.stringify(data));

                    if (!restore) message.channel.send(Embed({
                        title: "Data Saved",
                        description: ':white_check_mark: The Discord server was successfully backed up to **' + file + '**'
                    }));
                }

                if (!exists) {
                    fs.mkdir('./server_backups', function (err) {
                        if (err) console.log(err);
                        create_backup();
                    })
                } else {
                    create_backup()
                }
            })

        }

        async function restore() {
            const now = Date.now()
            const latest = require("../../server_backups/" + fs.readdirSync('./server_backups/').map(f => f.replace('.json', '')).filter(f => !f.startsWith("restore_")).sort((a, b) => (now - a) - (now - b))[0])

            if (!latest) return message.channel.send(Embed({ preset: "error", description: "There are no backups" }));

            message.channel.send(Embed({ title: "What would you like to restore?", description: "**🇦 All data\n🇷 Roles\n🇨 Channels\n🇪 Emojis**" })).then(async m => {
                let emojis = ["🇦", "🇷", "🇨", "🇪"];

                emojis.forEach(e => m.react(e))

                let type = await Utils.waitForReaction(emojis, message.member.id, m);
                type = type.emoji.name;

                m.delete();

                let confirmation = await message.channel.send(Embed({ color: "#ffa600", title: "Are you sure you would like to restore this data? All the current roles, channels, and/or emojis will be deleted then re-created."}))

                confirmation.react("✅")
                confirmation.react("❌")

                let confirmationEmoji = await Utils.waitForReaction(["❌", "✅"], message.member.id, confirmation);

                if (confirmationEmoji.emoji.name == "❌") {
                    confirmation.delete()
                    return
                }

                let logs = "";

                function log(text) {
                    const logText = `[${new Date().toLocaleString()}] ${text}`;
                    logs += logText + '\n';
                }

                let restoreRoles = async () => {
                    return new Promise(async resolve => {
                        log('Restoring roles');
                        let couldNotDelete = []
                        await message.guild.roles.cache.forEach(async role => {
                            log('Deleting role: ' + role.name);
                            await role.delete()
                                .catch(err => {
                                    couldNotDelete.push(role.id)
                                    log('Could not delete role ' + role.name);
                                    throw err
                                });
                        })

                        setTimeout(async function () {
                            await latest.roles.forEach(role => {
                                if (couldNotDelete.includes(role.id)) return
                                log('Creating role: ' + role.name);
                                message.guild.roles.create({
                                    data: {
                                        name: role.name,
                                        color: role.hexColor,
                                        hoist: role.hoisted,
                                        position: role.position,
                                        permissions: role.permissions,
                                        mentionable: role.mentionable
                                    }
                                }).catch(err => {
                                    log('Could not create role ' + role.name);
                                })
                            })
                            log('Done restoring roles.');
                            resolve()
                        }, 5000)
                    })
                }

                let restoreChannels = async () => {
                    return new Promise(async resolve => {
                        log('Restoring channels');
                        await message.guild.channels.cache.forEach(async channel => {
                            log('Deleting channel: ' + channel.name);
                            await channel.delete()
                                .catch(err => {
                                    log('Could not delete channel' + channel.name);
                                });
                        })
                        setTimeout(async function () {
                            await latest.channels.filter(c => c.type == 'category').concat(latest.channels.filter(c => c.type !== 'category'))
                                .forEach((channel, i) => {
                                    log('Creating channel: ' + channel.name);
                                    message.guild.channels.create(channel.name, { type: channel.type })
                                        .catch(err => {
                                            log('Could not create channel' + channel.name);
                                        })
                                        .then(ch => {
                                            if (channel.parent && ch && channel.type !== 'category') ch.setParent(Utils.findChannel(channel.parent, message.guild, 'category'));
                                        })
                                })
                            log('Done restoring channels.');
                            resolve()
                        }, 5000)
                    })
                }

                let restoreEmojis = async () => {
                    return new Promise(async resolve => {
                        log('Restoring emojis');
                        await message.guild.emojis.cache.forEach(async emoji => {
                            log('Deleting emoji: ' + emoji.name);
                            await emoji.delete()
                                .catch(err => {
                                    log('Could not delete emoji ' + emoji.name);
                                });
                        })
                        setTimeout(async function () {
                            await latest.emojis.forEach((emoji, i) => {
                                log('Creating emoji: ' + emoji.name);
                                message.guild.emojis.create(emoji.url, emoji.name)
                                    .catch(err => {
                                        log('Could not create emoji ' + emoji.name);
                                    })
                            })
                            log('Done restoring emojis.');
                            resolve()
                        }, 5000)
                    })
                }

                await save(true)
                log('Backed up current server data.');

                if (type == emojis[0]) {
                    await restoreRoles()
                    await restoreChannels()
                    await restoreEmojis()

                    let paste = await Utils.paste(logs)

                    if (message.guild.channels.cache.first()) message.guild.channels.cache.first().send(Embed({ title: "Restored All Data", description: "A log of what was changed can be viewed here: " + paste, color: Utils.variables.config.EmbedColors.Success }));
                }

                else if (type == emojis[1]) {
                    await restoreRoles()

                    let paste = await Utils.paste(logs)

                    if (message.guild.channels.cache.first()) message.guild.channels.cache.first().send(Embed({ title: "Restored Roles", description: "A log of what was changed can be viewed here: " + paste, color: Utils.variables.config.EmbedColors.Success }));
                }

                else if (type == emojis[2]) {
                    await restoreChannels()

                    let paste = await Utils.paste(logs)

                    if (message.guild.channels.cache.first()) message.guild.channels.cache.first().send(Embed({ title: "Restored Channels", description: "A log of what was changed can be viewed here: " + paste, color: Utils.variables.config.EmbedColors.Success }));
                }

                else if (type == emojis[3]) {
                    await restoreEmojis()

                    let paste = await Utils.paste(logs)

                    if (message.guild.channels.cache.first()) message.guild.channels.cache.first().send(Embed({ title: "Restored Emojis", description: "A log of what was changed can be viewed here: " + paste, color: Utils.variables.config.EmbedColors.Success }));
                }

            })
        }

        switch (type) {
            case "save":
                message.delete();
                save()

                break;
            case "restore":
                message.delete();
                restore()

                break;
            default:
                message.channel.send(Embed({ title: "Would you like to save data or restore data?", description: "🇸 **Save Data**\n🇷 **Restore Data**" })).then(async m => {
                    m.react("🇸")
                    m.react("🇷")

                    let reaction = await Utils.waitForReaction(["🇷", "🇸"], message.member.id, m)

                    m.delete();
                    message.delete();

                    if (reaction.emoji.name == "🇸") save()
                    else restore()
                })
                break;
        }
    },
    description: "Backup or restore your Discord server",
    aliases: [],
    usage: "backup [save/restore]"
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065