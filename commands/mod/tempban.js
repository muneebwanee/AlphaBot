const Utils = require("../../modules/utils.js");
const ms = require("ms");
const { config, lang, commands } = Utils.variables;
const Embed = Utils.Embed;

module.exports = {
    name: 'tempban',
    run: async (bot, message, args) => {
        let user = Utils.ResolveUser(message)
        let length = args[1];
        let reason = args.slice(2).join(" ");

        if (config.Moderation.Logs.Enabled && !Utils.findChannel(config.Moderation.Logs.Channel, message.guild)) return message.channel.send(Embed({ preset: 'console' }));
        if (args.length < 3 || !ms(args[1]) || !reason) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));
        if (!user) return message.channel.send(Embed({ preset: 'error', description: lang.GlobalErrors.InvalidUser, usage: module.exports.usage }));
        if (config.Moderation.AreStaffPunishable) {
            if (user.roles.highest.position >= message.member.roles.highest.position) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Errors.CantPunishStaffHigher }));
        } else {
            if (Utils.hasPermission(user, commands.Permissions.tempban)) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Errors.CantPunishStaff }));
        }
        if (user.user.bot == true || user.id == message.author.id) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Errors.CantPunishUser }));
        if (message.guild.me.roles.highest.position <= user.roles.highest.position) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Errors.BotCantPunishUser }));

        user.ban(reason);

        let punishment = {
            type: module.exports.name,
            user: user.id,
            tag: user.user.tag,
            reason: reason,
            time: message.createdAt.getTime(),
            executor: message.author.id,
            length: ms(length)
        }

        await Utils.variables.db.update.punishments.addPunishment(punishment)
        bot.emit('userPunished', punishment, user, message.member);

        message.channel.send(Utils.setupEmbed({
            configPath: {},
            title: lang.ModerationModule.Commands.Tempban.Embeds.Banned.Title,
            description: lang.ModerationModule.Commands.Tempban.Embeds.Banned.Description,
            color: config.EmbedColors.Success,
            variables: [
                ...Utils.userVariables(user, "user"),
                ...Utils.userVariables(message.member, "executor"),
                { searchFor: /{reason}/g, replaceWith: reason }
            ]
        }))

        setTimeout(function () {
            message.guild.members.unban(user, 'Tempban complete - Length: ' + length + ' Punished By: ' + message.author.tag);
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
        }, ms(args[1]));
    },
    description: "Temporarily ban a user on the Discord server",
    usage: 'tempban <@user> <length> <reason>',
    aliases: []
}

// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065