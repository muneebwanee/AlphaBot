const Utils = require('../../modules/utils');
const Embed = Utils.Embed;
const { config, lang } = Utils.variables;
module.exports = {
    name: "tempchannel",
    run: async (bot, message, args) => {
        let tempChannel = Utils.variables.tempChannels.get(message.author.id);

        if (!tempChannel || (tempChannel && !message.guild.channels.cache.get(tempChannel.channel.id))) return message.channel.send(Embed({ preset: "error", description: lang.GeneralModule.Commands.Tempchannels.Errors.NoTC }));

        let getFields = async () => {
            let tempChannel = await Utils.variables.tempChannels.get(message.author.id);

            let PrivateStatus = tempChannel.public ? [{ name: lang.GeneralModule.Commands.Tempchannels.Manager.Fields[1], value: "✅", inline: true }] : [{ name: lang.GeneralModule.Commands.Tempchannels.Manager.Fields[1], value: "❌", inline: true }, { name: lang.GeneralModule.Commands.Tempchannels.Manager.Fields[2], value: tempChannel.allowedUsers.map(id => "<@" + id + ">").join(", "), inline: true }]
            let PrivateActions = tempChannel.public ? [{ name: "\u200B", value: lang.GeneralModule.Commands.Tempchannels.Manager.Fields[5], inline: true }] : [{ name: "\u200B", value: lang.GeneralModule.Commands.Tempchannels.Manager.Fields[6], inline: true }, { name: "\u200B", value: lang.GeneralModule.Commands.Tempchannels.Manager.Fields[7], inline: true }];
            let Spacer = tempChannel.public ? [] : [{ name: "\u200B", value: "\u200B", inline: true }, { name: "\u200B", value: "\u200B", inline: true }];

            return [
                { name: lang.GeneralModule.Commands.Tempchannels.Manager.Fields[0], value: tempChannel.channel.name, inline: true },
                ...PrivateStatus,
                { name: lang.GeneralModule.Commands.Tempchannels.Manager.Fields[3], value: tempChannel.maxMembers ? tempChannel.maxMembers : lang.GeneralModule.Commands.Tempchannels.Manager.NoMaxMembers, inline: true },
                ...Spacer,
                { name: "\u200B", value: lang.GeneralModule.Commands.Tempchannels.Manager.Fields[4], inline: true },
                ...PrivateActions,
                { name: "\u200B", value: lang.GeneralModule.Commands.Tempchannels.Manager.Fields[8], inline: true },
                { name: "\u200B", value: lang.GeneralModule.Commands.Tempchannels.Manager.Fields[9], inline: true }
            ]
        }

        message.channel.send(Embed({
            title: lang.GeneralModule.Commands.Tempchannels.Manager.Title,
            author: {
                icon: message.author.displayAvatarURL({ dynamic: true }),
                text: message.author.username
            },
            fields: await getFields()
        })).then(msg => {
            let PrivateEmojis = tempChannel.public ? ["🔐"] : ["🔓", "🚫"];
            let Emojis = ["👑", ...PrivateEmojis, "🎚️", "✏️"]
            Emojis.forEach(emoji => {
                msg.react(emoji)
            })

            let updateEmbed = async () => {
                let tempChannel = await Utils.variables.tempChannels.get(message.author.id);
                if (!tempChannel || (tempChannel && !message.guild.channels.cache.get(tempChannel.channel.id))) {
                    message.channel.send(Embed({ preset: "error", description: lang.GeneralModule.Commands.Tempchannels.Errors.TCDeleted }))

                    let e = msg.embeds[0]
                    e.title = lang.GeneralModule.Commands.Tempchannels.Manager.SessionEnded
                    e.color = config.EmbedColors.Error
                    msg.edit(e)
                } else {
                    msg.edit(Embed({
                        title: lang.GeneralModule.Commands.Tempchannels.Manager.Title,
                        author: {
                            icon: message.author.displayAvatarURL({ dynamic: true }),
                            text: message.author.username
                        },
                        fields: await getFields()
                    }))
                }
            }

            let deleteMessage = m => {
                m.delete({ timeout: 3000 })
            }

            let checkChannel = async () => {
                let tempChannel = await Utils.variables.tempChannels.get(message.author.id)

                if (!tempChannel) return false

                let channel = message.guild.channels.cache.get(tempChannel.channel.id)
                if (!channel) message.channel.send(Embed({ preset: "error", description: lang.GeneralModule.Commands.Tempchannels.Errors.NoTC }))
                return !!channel
            }

            let checkError = (err) => {

                if (err.message == "Unknown Channel") {
                    return
                }

                if (err.message == "Missing Permission") {
                    return message.channel.send(Embed({ preset: "error", description: lang.GeneralModule.Commands.Tempchannels.Errors.NoPermission }))
                }

                else {
                    console.log(err)
                    return message.channel.send(Embed({ preset: "console" }));
                }
            }

            let collector = msg.createReactionCollector((reaction, member) => Emojis.includes(reaction.emoji.name) && member.id == message.author.id, { time: 5 * 60 * 1000 });
            let editing = false;

            collector.on('collect', async reaction => {
                let channel = message.guild.channels.cache.get(tempChannel.channel.id)
                reaction.users.remove(message.author.id)

                if (editing) return message.channel.send(Embed({ preset: "error", description: lang.GeneralModule.Commands.Tempchannels.Errors.FinishCurrentAction })).then(m => m.delete({ timeout: 3000 }))

                if (!await checkChannel()) return collector.emit('end')

                editing = true
                let retry = true
                if (reaction.emoji.name == "👑") {
                    let m = await message.channel.send(Embed({ title: lang.GeneralModule.Commands.Tempchannels.TransferOwnership.Questions }));
                    let user;
                    cancelled = false
                    while (retry) {
                        await Utils.waitForResponse(message.author.id, message.channel).then(res => {
                            res.delete();
                            if (res.content == 'cancel') {
                                cancelled = true
                                retry = false
                                m.delete();
                                return message.channel.send(Embed({ preset: "error", description: lang.GeneralModule.Commands.Tempchannels.TransferOwnership.Canceled })).then(deleteMessage);
                            }
                            if (res.mentions.users.size) {
                                user = res.mentions.users.first()
                                if (user.bot) {
                                    return message.channel.send(Embed({ preset: "error", description: lang.GeneralModule.Commands.Tempchannels.TransferOwnership.Errors.TransferToBot })).then(deleteMessage);
                                }
                                if (!channel.members.has(user.id)) {
                                    return message.channel.send(Embed({ preset: "error", description: lang.GeneralModule.Commands.Tempchannels.TransferOwnership.Errors.NotInTC })).then(deleteMessage);
                                }
                                m.delete();
                                retry = false
                            } else {
                                return message.channel.send(Embed({ preset: "error", description: lang.GeneralModule.Commands.Tempchannels.TransferOwnership.Errors.NoMention })).then(deleteMessage);
                            }
                        })
                    }
                    if (cancelled) return editing = false;
                    if (!await checkChannel()) return collector.emit('end')

                    m.delete();
                    console.log(Utils.variables.tempChannels)
                    let savedData = Object.assign({}, tempChannel);
                    Utils.variables.tempChannels.delete(message.author.id)
                    Utils.variables.tempChannels.set(user.id, savedData)
                    console.log(Utils.variables.tempChannels)
                    message.channel.send(Embed({ title: lang.GeneralModule.Commands.Tempchannels.TransferOwnership.Transferred })).then(deleteMessage);
                    message.channel.send(lang.GeneralModule.Commands.Tempchannels.TransferOwnership.Notification.replace(/{new-owner}/g, `<@${user.id}>`).replace(/{old-owner}/g, message.author))
                    collector.emit('end')
                } else if (reaction.emoji.name == "🎚️") {
                    let m = await message.channel.send(Embed({ title: lang.GeneralModule.Commands.Tempchannels.ChangeLimit.Question }))
                    while (retry) {
                        await Utils.waitForResponse(message.author.id, message.channel)
                            .then(async res => {
                                res.delete()

                                if (res.content == "none") {
                                    retry = false;
                                    tempChannel.maxMembers = false
                                    return channel.setUserLimit(0);
                                }

                                if (!parseInt(res.content)) return message.channel.send(Embed({ preset: "error", description: lang.GeneralModule.Commands.Tempchannels.ChangeLimit.Errors.InvalidResponse })).then(deleteMessage);

                                let number = parseInt(res.content);

                                if (number < 2 || number > 99) return message.channel.send(Embed({ preset: 'error', description: lang.GeneralModule.Commands.Tempchannels.ChangeLimit.Errors.InvalidRange })).then(deleteMessage);

                                retry = false
                                tempChannel.maxMembers = number
                                channel.setUserLimit(number).catch(checkError)
                            })
                    }
                    m.delete()
                    if (!await checkChannel()) return collector.emit('end')
                    message.channel.send(Embed({ title: lang.GeneralModule.Commands.Tempchannels.ChangeLimit.Updated })).then(deleteMessage);
                    updateEmbed()
                } else if (reaction.emoji.name == "✏️") {
                    let m = await message.channel.send(Embed({ title: lang.GeneralModule.Commands.Tempchannels.ChangeName.Question }))
                    bot.DoNotAnnounceFilter = true
                    bot.DoNotAnnounceAntiAd = true
                    while (retry) {
                        await Utils.waitForResponse(message.author.id, message.channel)
                            .then(async res => {
                                res.delete()
    
                                if (await Utils.variables.db.get.getCommands('filter') && (await Utils.variables.db.get.getCommands('filter')).enabled) {
                                    if (!Utils.hasPermission(message.member, config.Other.FilterBypassRole.toLowerCase())) {
                                        const filter = await Utils.variables.db.get.getFilter();
                                        let words = res.content.split(" ");

                                        if (words.some(word => filter.map(w => w.toLowerCase()).includes(word.toLowerCase()))) return message.channel.send(Embed({ preset: "error", description: lang.GeneralModule.Commands.Tempchannels.ChangeName.Errors.Filter })).then(deleteMessage);
                                    }
                                }
                                if (Utils.hasAdvertisement(res.content) && config.AntiAdvertisement.Chat.Enabled && !Utils.hasPermission(message.member, config.AntiAdvertisement.BypassRole)) {
                                    return message.channel.send(Embed({ preset: "error", description: lang.GeneralModule.Commands.Tempchannels.ChangeName.Errors.AntiAd })).then(deleteMessage);
                                }
                                retry = false
                                tempChannel.channel.name = res.content
                                channel.setName(res.content).catch(checkError)
                            })
                    }
                    bot.DoNotAnnounceFilter = false
                    bot.DoNotAnnounceAntiAd = false

                    m.delete()
                    if (!await checkChannel()) return collector.emit('end')
                    message.channel.send(Embed({ title: lang.GeneralModule.Commands.Tempchannels.ChangeName.Updated })).then(deleteMessage);
                    updateEmbed()
                } else if (reaction.emoji.name == "🔐") {
                    let m = await message.channel.send(Embed({ title: lang.GeneralModule.Commands.Tempchannels.MakePrivate.Question }))
                    let perms;
                    while (retry) {
                        await Utils.waitForResponse(message.author.id, message.channel)
                            .then(async res => {
                                res.delete()
                                let allowedUsers = [bot.user.id]

                                if (res.content == 'none') {
                                    retry = false
                                }

                                else if (res.mentions.users.size) {
                                    retry = false
                                    allowedUsers.push(...res.mentions.users.map(u => u.id))
                                }

                                else {
                                    return message.channel.send(Embed({ preset: 'error', description: lang.GeneralModule.Commands.Tempchannels.MakePrivate.Errors.InvalidResponse })).then(deleteMessage);
                                }

                                retry = false
                                tempChannel.allowedUsers = allowedUsers;

                                perms = [
                                    {
                                        id: message.guild.id,
                                        allow: ['VIEW_CHANNEL'],
                                        deny: ['CONNECT'],
                                    },
                                    {
                                        id: message.author.id,
                                        allow: ['VIEW_CHANNEL', 'CONNECT', 'SPEAK']
                                    },
                                    ...allowedUsers.map(user => {
                                        return {
                                            id: user,
                                            allow: ['VIEW_CHANNEL', 'CONNECT', 'SPEAK']
                                        }
                                    })
                                ]
                            })
                    }

                    if (!await checkChannel()) return collector.emit('end')

                    channel.overwritePermissions(perms).catch(checkError)
                    channel.members.filter(member => !tempChannel.allowedUsers.includes(member.id) && member.id !== message.author.id ).forEach(member => {
                        member.voice.kick()
                    })

                    m.delete()
                    tempChannel.public = false

                    Emojis.push("🔓", "🚫")
                    msg.react("🔓")
                    msg.react("🚫")

                    Emojis.splice(Emojis.indexOf("🔐"), 1)
                    reaction.remove()

                    message.channel.send(Embed({ title: lang.GeneralModule.Commands.Tempchannels.MakePrivate.Privated })).then(deleteMessage);
                    updateEmbed()
                } else if (reaction.emoji.name == "🔓") {
                    tempChannel.public = true
                    tempChannel.allowedUsers = []

                    if (!await checkChannel()) return collector.emit('end')
                    channel.overwritePermissions([{
                        id: message.guild.id,
                        allow: ['CONNECT']
                    }]).catch(checkError)
                    message.channel.send(Embed({ title: lang.GeneralModule.Commands.Tempchannels.MakePublic.Public })).then(deleteMessage);
                    Emojis.push("🔐")
                    msg.react("🔐")

                    Emojis.splice(Emojis.indexOf("🔓"), 1)
                    Emojis.splice(Emojis.indexOf("🚫"), 1)
                    reaction.remove()
                    reaction.message.reactions.cache.get("🚫").remove()

                    updateEmbed()
                } else if (reaction.emoji.name == "🚫") {
                    let m = await message.channel.send(Embed({ title: lang.GeneralModule.Commands.Tempchannels.ChangeUsers.Questions[0] }))
                    m.react("➕")
                    m.react('➖')
                    let announce = true;
                    await Utils.waitForReaction(["➖", "➕"], message.author.id, m)
                        .then(async reaction => {
                            if (reaction.emoji.name == "➕") {
                                m.delete();
                                let mesg = await message.channel.send(Embed({ title: lang.GeneralModule.Commands.Tempchannels.ChangeUsers.Questions[1] }));

                                while (retry) {
                                    await Utils.waitForResponse(message.author.id, message.channel).then(async res => {
                                        res.delete();
                                        if (res.mentions.users.size) {
                                            retry = false;
                                            mesg.delete();
                                            res.mentions.users = res.mentions.users.filter(user => !tempChannel.allowedUsers.includes(user.id) || user.id == message.author.id);
                                            if (!res.mentions.users.size) {
                                                retry = false
                                                announce = false
                                                return message.channel.send(Embed({ preset: "error", description: lang.GeneralModule.Commands.Tempchannels.ChangeUsers.Errors.AlreadyAdded })).then(deleteMessage);
                                            }
                                            tempChannel.allowedUsers.push(...res.mentions.users.map(u => u.id).filter(u => !tempChannel.allowedUsers.includes(u)));
                                            res.mentions.users.forEach(user => {
                                                channel.createOverwrite(user.id, {
                                                    CONNECT: true,
                                                    SPEAK: true,
                                                    VIEW_CHANNEL: true
                                                }).catch(checkError)
                                            })
                                        } else {
                                            return message.channel.send(Embed({ preset: "error", description: lang.GeneralModule.Commands.Tempchannels.ChangeUsers.Errors.InvalidResponse })).then(deleteMessage);
                                        }
                                    })
                                }
                            } else {
                                m.delete();
                                let mesg = await message.channel.send(Embed({ title: lang.GeneralModule.Commands.Tempchannels.ChangeUsers.Questions[2] }));

                                while (retry) {
                                    await Utils.waitForResponse(message.author.id, message.channel).then(async res => {
                                        res.delete();
                                        if (res.mentions.users.size) {
                                            retry = false;
                                            mesg.delete();
                                            res.mentions.users = res.mentions.users.filter(user => ![bot.user.id, message.author.id].includes(user.id) && tempChannel.allowedUsers.includes(user.id));
                                            if (!res.mentions.users.size) {
                                                retry = false
                                                announce = false
                                                return message.channel.send(Embed({ preset: "error", description: lang.GeneralModule.Commands.Tempchannels.ChangeUsers.Errors.CantRemoveUsers })).then(deleteMessage);
                                            }
                                            res.mentions.users.forEach(user => {
                                                tempChannel.allowedUsers.splice(tempChannel.allowedUsers.indexOf(user.id), 1)

                                                channel.createOverwrite(user.id, {
                                                    CONNECT: false,
                                                    VIEW_CHANNEL: true
                                                }).catch(checkError)

                                                if (channel.members.has(user.id)) channel.members.get(user.id).voice.kick()
                                            })
                                        } else {
                                            return message.channel.send(Embed({ preset: "error", description: lang.GeneralModule.Commands.Tempchannels.ChangeUsers.Errors.InvalidResponse })).then(deleteMessage);
                                        }
                                    })
                                }
                            }
                        })
                    if (!await checkChannel()) return collector.emit('end')
                    if (announce) message.channel.send(Embed({ title: lang.GeneralModule.Commands.Tempchannels.ChangeUsers.Updated })).then(deleteMessage);
                    updateEmbed()
                }
                editing = false
            })

            collector.on('end', async () => {
                let e = msg.embeds[0]
                e.title = lang.GeneralModule.Commands.Tempchannels.Manager.SessionEnded
                e.color = config.EmbedColors.Error
                msg.edit(e)
            })
        })
    },
    description: "Manage your temp channel",
    usage: "tempchannel",
    aliases: ['tc']
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065