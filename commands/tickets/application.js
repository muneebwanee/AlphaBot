const Utils = require('../../modules/utils');
const Embed = Utils.Embed;
const { config, lang } = Utils.variables;
module.exports = {
    name: "application",
    run: async (bot, message, args, { prefixUsed, commandUsed }) => {
        const member = message.member;
        const type = args[0] ? args[0].toLowerCase() : "none";
        const application = await Utils.variables.db.get.getApplications(message.channel.id)

        if (!application) return message.channel.send(Embed({ preset: 'error', description: lang.TicketModule.Commands.Application.Errors.NotApplication }));
        const applyingUser = message.guild.member(application.creator);
        if (!applyingUser) return message.channel.send(Embed({ preset: 'error', description: lang.TicketModule.Commands.Application.Errors.UserLeft }));

        async function acceptApplication(reason) {
            const positions = config.Applications.Positions;
            const position = positions[application.rank];
            if (!position) return message.channel.send(Embed({ preset: 'error', description: lang.TicketModule.Commands.Application.Errors.PositionNotFound.replace(/{pos}/g, application.rank) }));

            if (config.Applications.AddRoleWhenAccepted) {
                const role = Utils.findRole(position.Role, message.channel.guild);
                if (!role) message.channel.send(Embed({ preset: "error", description: lang.TicketModule.Commands.Application.RoleNotFound.replace(/{role}/g, position.Role) }))
                else applyingUser.roles.add(role);
            }

            const embed = Utils.Embed({ title: lang.TicketModule.Commands.Application.Embeds.Accepted.Title, description: lang.TicketModule.Commands.Application.Embeds.Accepted.Description.replace(/{reason}/g, reason), color: config.EmbedColors.Success });
            if (config.Applications.DMDecision) applyingUser.send(embed).catch(error => message.channel.send(lang.TicketModule.Commands.Application.Errors.CantNotify));

            await Utils.variables.db.update.applications.setStatus(message.channel.id, 'Accepted')

            message.channel.send(`<@${applyingUser.id}>`, { embed: embed.embed });

            let newTopic = config.Applications.Channel.Topic.replace(/{user-tag}/g, applyingUser.user.tag).replace(/{user-id}/g, applyingUser.id).replace(/{position}/g, application.rank).replace(/{status}/g, "Accepted")
            await message.channel.setTopic(newTopic).then(ch => console.log(ch.topic))

            bot.emit("applicationAccepted", application, member, reason);
        }

        async function denyApplication(reason) {
            const embed = Utils.Embed({ title: lang.TicketModule.Commands.Application.Embeds.Denied.Title, description: lang.TicketModule.Commands.Application.Embeds.Denied.Description.replace(/{reason}/g, reason), color: config.EmbedColors.Error });
            if (config.Applications.DMDecision) applyingUser.send(embed).catch(error => message.channel.send(lang.TicketModule.Commands.Application.Errors.CantNotify));

            await Utils.variables.db.update.applications.setStatus(message.channel.id, 'Denied')

            message.channel.send(`<@${applyingUser.id}>`, { embed: embed.embed });

            let newTopic = config.Applications.Channel.Topic.replace(/{user-tag}/g, applyingUser.user.tag).replace(/{user-id}/g, applyingUser.id).replace(/{position}/g, application.rank).replace(/{status}/g, "Denied")
            await message.channel.setTopic(newTopic).then(ch => console.log(ch.topic))

            bot.emit("applicationDenied", application, member, reason);
        }

        function closeApplication(reason) {
            message.channel.delete();
            require('../../modules/transcript.js')(message.channel.id, false);

            bot.emit("applicationClosed", application, member, reason);
        }

        async function lockApplication() {
            if (!message.channel.permissionsFor(applyingUser).has("SEND_MESSAGES")) return message.channel.send(Embed({
                preset: 'error',
                description: lang.TicketModule.Commands.Application.Errors.AlreadyLocked
            }))
            await message.channel.createOverwrite(applyingUser, { "SEND_MESSAGES": false, "VIEW_CHANNEL": true });
            message.channel.send(Embed({
                title: lang.TicketModule.Commands.Application.Embeds.Locked.Title,
                description: lang.TicketModule.Commands.Application.Embeds.Locked.Description
            }))
            bot.emit("applicationLocked", application, member);
        }

        async function unlockApplication() {
            if (message.channel.permissionsFor(applyingUser).has("SEND_MESSAGES")) return message.channel.send(Embed({
                preset: 'error',
                description: lang.TicketModule.Commands.Application.Errors.AlreadyUnlocked
            }))
            await message.channel.createOverwrite(applyingUser, { "SEND_MESSAGES": true, "VIEW_CHANNEL": true });
            message.channel.send(Embed({
                title: lang.TicketModule.Commands.Application.Embeds.Unlocked.Title,
                description: lang.TicketModule.Commands.Application.Embeds.Unlocked.Description
            }))
            bot.emit("applicationUnlocked", application, member);
        }

        async function getReason() {
            return new Promise(async resolve => {
                if (args.slice(1).length > 0) return resolve(args.slice(1).join(" "));
                await message.channel.send(Embed({ title: lang.TicketModule.Commands.Application.Embeds.Reason.Title, description: lang.TicketModule.Commands.Application.Embeds.Reason.Description })).then(async msg => {
                    await message.channel.awaitMessages(m => m.author.id == message.author.id, { max: 1, time: 5 * 60000, errors: ['time'] }).then(m => {
                        msg.delete().catch(err => { })
                        m = m.first();
                        m.delete().catch(err => { })

                        if (['no', 'none'].includes(m.content)) return resolve("N/A")
                        else return resolve(m.content)
                    }).catch(err => {
                        msg.delete().catch(err => { })
                        message.channel.send(Embed({
                            preset: 'error',
                            description: lang.TicketModule.Commands.Application.Errors.NoReason
                        }))
                        return resolve(undefined)
                    })
                })
            })
        }

        if (["accept", "deny"].includes(commandUsed)) type = commandUsed;

        switch (type) {
            case 'accept':
                if (application.status == 'Accepted') return message.channel.send(Embed({ preset: "error", description: lang.TicketModule.Commands.Application.Errors.AlreadyAccepted }))
                let reason1 = await getReason();
                if (!reason1) return
                else return acceptApplication(reason1);
            case 'deny':
                if (application.status == 'Denied') return message.channel.send(Embed({ preset: "error", description: lang.TicketModule.Commands.Application.Errors.AlreadyDenied }))
                let reason2 = await getReason();
                if (!reason2) return
                else return denyApplication(reason2);
            case 'close':
                let reason3 = await getReason();
                if (!reason3) return
                else return closeApplication(reason3);
            case 'lock':
                return lockApplication();
            case 'unlock':
                return unlockApplication();
            default:
                message.channel.send(Embed({
                    title: lang.TicketModule.Commands.Application.Embeds.Menu.Title,
                    fields: [
                        { name: lang.TicketModule.Commands.Application.Embeds.Menu.Fields[0], value: `<@${applyingUser.id}>`, inline: true },
                        { name: lang.TicketModule.Commands.Application.Embeds.Menu.Fields[1], value: application.rank, inline: true },
                        { name: lang.TicketModule.Commands.Application.Embeds.Menu.Fields[2], value: application.status, inline: true },
                        { name: "\u200B", value: lang.TicketModule.Commands.Application.Embeds.Menu.Fields[3], inline: true },
                        { name: "\u200B", value: lang.TicketModule.Commands.Application.Embeds.Menu.Fields[4], inline: true },
                        { name: "\u200B", value: lang.TicketModule.Commands.Application.Embeds.Menu.Fields[5], inline: true },
                        { name: "\u200B", value: lang.TicketModule.Commands.Application.Embeds.Menu.Fields[6], inline: true },
                        { name: "\u200B", value: lang.TicketModule.Commands.Application.Embeds.Menu.Fields[7], inline: true },

                    ]
                })).then(async msg => {
                    let emojis = ["✅", "❌", "🗑️", "🔒", "🔓"]
                    emojis.forEach(emoji => {
                        msg.react(emoji)
                    })

                    await msg.awaitReactions((reaction, user) => emojis.includes(reaction.emoji.name) && user.id == message.author.id, { max: 1, time: 5 * 60000, errors: ['time'] }).then(async reaction => {
                        reaction = reaction.first();
                        msg.delete();
                        switch (reaction.emoji.name) {
                            case "✅":
                                if (application.status == 'Accepted') return message.channel.send(Embed({ preset: "error", description: lang.TicketModule.Commands.Application.Errors.AlreadyAccepted }))
                                let reason1 = await getReason();
                                if (!reason1) return
                                else return acceptApplication(reason1);
                            case "❌":
                                if (application.status == 'Denied') return message.channel.send(Embed({ preset: "error", description: lang.TicketModule.Commands.Application.Errors.AlreadyDenied }))
                                let reason2 = await getReason();
                                if (!reason2) return
                                else return denyApplication(reason2);
                            case "🗑️":
                                let reason3 = await getReason();
                                if (!reason3) return
                                else return closeApplication(reason3);
                            case "🔒":
                                return lockApplication();
                            case "🔓":
                                return unlockApplication();
                            default:
                                return;
                        }
                    }).catch(err => {
                        msg.edit(Embed({
                            title: lang.TicketModule.Commands.Application.Embeds.SessionOver.Title,
                            description: lang.TicketModule.Commands.Application.Embeds.SessionOver.Description
                                .replace(/{applicant}/g, `<@${applyingUser.id}>`)
                                .replace(/{position}/g, application.rank)
                                .replace(/{status}/g, application.status)
                        }))
                    })
                })
        }
    },
    description: "Open the application menu and perform actions on an application",
    usage: "application [accept/deny/close/lock/unlock] [reason]",
    aliases: ['applicationmenu', 'accept', 'deny']
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065