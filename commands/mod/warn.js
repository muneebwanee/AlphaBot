const Utils = require("../../modules/utils.js");
const { config, lang, commands } = Utils.variables;
const Embed = Utils.Embed;
const ms = require('ms');

module.exports = {
    name: 'warn',
    run: async (bot, message, args) => {
        let user = Utils.ResolveUser(message);
        let reason = args.slice(1).join(" ");

        if (config.Moderation.Logs.Enabled && !Utils.findChannel(config.Moderation.Logs.Channel, message.guild)) return message.channel.send(Embed({ preset: 'console' }));
        if (args.length < 2 || !user || !reason) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));
        if (config.Moderation.AreStaffPunishable) {
            if (user.roles.highest.position >= message.member.roles.highest.position) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Errors.CantPunishStaffHigher }))
        } else {
            if (Utils.hasPermission(user, commands.Permissions.warn)) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Errors.CantPunishStaff }))
        }
        if (user.user.bot == true || user.id == message.author.id) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Errors.CantPunishUser }));

        let warning = {
            user: user.id,
            tag: user.user.tag,
            reason: reason,
            time: message.createdAt.getTime(),
            executor: message.author.id,
            type: "warn"
        }

        await Utils.variables.db.update.punishments.addWarning(warning)

        let warns = await Utils.variables.db.get.getWarnings(user);

        warning.warnCount = warns.length
        warning.id = warns[warns.length - 1].id

        bot.emit('userPunished', warning, user, message.member)

        message.channel.send(Utils.setupEmbed({
            configPath: {},
            title: lang.ModerationModule.Commands.Warn.Embeds.Warned.Title,
            description: lang.ModerationModule.Commands.Warn.Embeds.Warned.Description,
            color: config.EmbedColors.Success,
            variables: [
                ...Utils.userVariables(user, "user"),
                ...Utils.userVariables(message.member, "executor"),
                { searchFor: /{reason}/g, replaceWith: reason }
            ]
        }))

        user.send(Embed({
            title: lang.ModerationModule.Commands.Warn.Embeds.DM.Title,
            fields: [
                { name: lang.ModerationModule.Commands.Warn.Embeds.DM.Fields[0], value: message.guild.name },
                { name: lang.ModerationModule.Commands.Warn.Embeds.DM.Fields[1], value: reason },
                { name: lang.ModerationModule.Commands.Warn.Embeds.DM.Fields[2], value: warns.length }
            ],
            color: config.EmbedColors.Error
        })).catch(err => { });

        if (Object.keys(config.Moderation.AutoWarnPunishments).find(key => parseInt(key) == parseInt(warns.length))) {
            let warnCount = Object.keys(config.Moderation.AutoWarnPunishments).find(key => parseInt(key) == parseInt(warns.length));
            let autoP = Object.values(config.Moderation.AutoWarnPunishments)[Object.keys(config.Moderation.AutoWarnPunishments).indexOf(warnCount)];
            let reason = autoP[1];
            let length = autoP[2];

            if (!reason) reason = "Auto Warn Punish"
            if (!length || !ms(length)) length = ms("3d");

            if (autoP[0] == 'ban') {
                user.ban({ reason: reason })

                let punishment = {
                    type: "ban",
                    user: user.id,
                    tag: user.user.tag,
                    reason: reason,
                    time: message.createdAt.getTime(),
                    executor: bot.user.id
                }

                await Utils.variables.db.update.punishments.addPunishment(punishment)
                bot.emit('userPunished', punishment, user, message.member)
            } else if (autoP[0] == 'kick') {
                user.kick(reason);

                let punishment = {
                    type: "kick",
                    user: user.id,
                    tag: user.user.tag,
                    reason: reason,
                    time: message.createdAt.getTime(),
                    executor: bot.user.id
                }

                await Utils.variables.db.update.punishments.addPunishment(punishment)
                bot.emit('userPunished', punishment, user, message.member)
            } else if (autoP[0] == 'mute') {
                let muteRole = Utils.findRole(config.Moderation.MuteRole, message.guild);
                if (!muteRole) return message.channel.send(Embed({ preset: 'console' }));

                user.roles.add(muteRole.id);

                let punishment = {
                    type: "mute",
                    user: user.id,
                    tag: user.user.tag,
                    reason: reason,
                    time: message.createdAt.getTime(),
                    executor: bot.user.id
                }

                await Utils.variables.db.update.punishments.addPunishment(punishment)
                bot.emit('userPunished', punishment, user, message.member)
            } else if (autoP[0] == 'tempban') {
                user.ban({ reason: reason });

                let punishment = {
                    type: "tempban",
                    user: user.id,
                    tag: user.user.tag,
                    reason: reason,
                    time: message.createdAt.getTime(),
                    executor: bot.user.id,
                    length: ms(length)
                }

                await Utils.variables.db.update.punishments.addPunishment(punishment)
                bot.emit('userPunished', punishment, user, message.member)

                setTimeout(function () {
                    message.guild.members.unban(user, 'Tempban complete - Length: ' + length + ' Punished By: ' + bot.user.tag + ' - Auto punish');
                    message.channel.send(Utils.setupEmbed({
                        configPath: {},
                        title: lang.ModerationModule.Commands.Tempban.Embeds.Unbanned.Title,
                        description: lang.ModerationModule.Commands.Tempban.Embeds.Unbanned.Description,
                        color: config.EmbedColors.Success,
                        variables: [
                            ...Utils.userVariables(user, "user"),
                            ...Utils.userVariables(message.member, "executor")
                        ]
                    }))

                    bot.emit('userUnpunished', module.exports.name, user, message.member)
                }, ms(length));
            } else if (autoP[0] == 'tempmute') {
                let muteRole = Utils.findRole(config.Moderation.MuteRole, message.guild);
                if (!muteRole) return message.channel.send(Embed({ preset: 'console' }));

                user.roles.add(muteRole.id);

                let punishment = {
                    type: "tempmute",
                    user: user.id,
                    tag: user.user.tag,
                    reason: reason,
                    time: message.createdAt.getTime(),
                    executor: bot.user.id,
                    length: ms(length)
                }

                await Utils.variables.db.update.punishments.addPunishment(punishment)
                bot.emit('userPunished', punishment, user, message.member)

                setTimeout(function () {
                    user.roles.remove(muteRole.id);
                    message.channel.send('<@' + user.id + '>').then(msg => msg.delete({ timeout: 2000 }));
                    message.channel.send(Utils.setupEmbed({
                        configPath: {},
                        title: lang.ModerationModule.Commands.Tempmute.Embeds.Unmuted.Title,
                        description: lang.ModerationModule.Commands.Tempmute.Embeds.Unmuted.Description,
                        color: config.EmbedColors.Success,
                        variables: [
                            ...Utils.userVariables(user, "user"),
                            ...Utils.userVariables(message.member, "executor")
                        ]
                    }))

                    bot.emit('userUnpunished', module.exports.name, user, message.member)

                }, ms(length));
            }

            let extraInfo = autoP[0].includes("temp") ? lang.ModerationModule.Commands.Warn.Embeds.AutoPunish.TempPunishExtraInfo.replace(/{length}/g, Utils.DDHHMMSSfromMS(ms(length))) : " "

            message.channel.send(Utils.setupEmbed({
                configPath: {},
                title: lang.ModerationModule.Commands.Warn.Embeds.AutoPunish.Title,
                description: lang.ModerationModule.Commands.Warn.Embeds.AutoPunish.Description,
                variables: [
                    ...Utils.userVariables(user, "user"),
                    { searchFor: /{extra}/g, replaceWith: extraInfo },
                    { searchFor: /{punishment}/g, replaceWith: (autoP[0].endsWith("e") ? autoP[0] + "d" : autoP[0].endsWith("n") ? autoP[0] + "ned" : autoP[0] + "ed") },
                    { searchFor: /{warncount}/g, replaceWith: warns.length }
                ]
            }))
        }
    },
    description: "Warn a user on the Discord server",
    usage: 'warn <@user> <reason>',
    aliases: []
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065