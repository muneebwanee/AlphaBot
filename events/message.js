const Utils = require('../modules/utils.js');
const variables = Utils.variables;
const fs = require('fs');
const Embed = Utils.Embed;
const { findBestMatch } = require('string-similarity')
const chalk = require("chalk");
const { userVariables } = require('../modules/utils.js');

const cooldowns = {
    coins: {
        cooldownSeconds: variables.config.Cooldowns.experience || 5,
        cooldown: new Set()
    },
    xp: {
        cooldownSeconds: variables.config.Cooldowns.coins || 5,
        cooldown: new Set()
    },
    cmd: []
}

module.exports = async (bot, message) => {
    const CommandHandler = require('../modules/handlers/CommandHandler.js');
    if (fs.existsSync("./commands") && require('../modules/handlers/KeyHandler.js').verified && CommandHandler.commands.length > 0) {

        const { config, lang, embeds } = variables;

        if (message.channel.type === "dm" && !message.author.bot && config.Logs.Enabled.includes("DMs")) {
            const logs = Utils.findChannel(config.Logs.Channels.DMs, bot.guilds.cache.find(g => g.member(message.author.id)));
            if (logs) {
                const attachments = message.attachments.map(a => a.url);
                logs.send(Utils.Embed({
                    title: lang.LogSystem.DMs.Title,
                    fields: [
                        {
                            name: lang.LogSystem.DMs.Fields[0],
                            value: `<@${message.author.id}> (${message.author.tag})`
                        },
                        {
                            name: lang.LogSystem.DMs.Fields[1],
                            value: message.content + (attachments.length > 0 ? `\n\n${lang.LogSystem.DMs.Attachments}\n` + attachments.join('\n') : "")
                        }
                    ]
                }))
            }
            return;
        }

        if (config.Logs.Enabled.includes("Chat") && message.guild) {
            await fs.appendFileSync('./logs/' + Utils.getMMDDYYYY() + '-chatlogs.txt', `[${new Date().toISOString()}] [G: ${message.guild.name} (${message.guild.id})] [C: ${message.channel.name} (${message.channel.id})] [A: ${message.author.tag} (${message.author.id})] ${message.content}\n`, function (err) {
                if (err) throw err;
            });
        }

        // TRANSCRIPTS
        const ticket = await Utils.variables.db.get.getTickets(message.channel.id);
        message.ticket = ticket;

        if (ticket) {
            Utils.transcriptMessage(message);
        }

        const application = await Utils.variables.db.get.getApplications(message.channel.id);
        message.application = application

        if (application) {
            Utils.transcriptMessage(message, false)
        }

        if (message.author.bot) return;

        const validPrefixes = [`<@!${bot.user.id}>`, await variables.db.get.getPrefixes(message.guild.id), config.Prefix];

        const prefixFound = validPrefixes.find(p => message.content.startsWith(p));

        const args = [];
        message.content.replace(/\s+/g, ' ').trim().split(" ").forEach((arg, i) => {
            // If the prefix is mentioning the bot and the argument is the second (the command)
            if (prefixFound == validPrefixes[0] && i == 1) args[0] += arg;
            else args.push(arg);
        })

        let cmd;
        let command;

        if (prefixFound) {
            cmd = args.shift().slice(prefixFound.length);
            command = CommandHandler.find(cmd, true);
        }


        if (config.Other.MissingRolesAndChannelsNotification && (command ? !["command", "modules", "reload", "setup"].includes(command.command) : true)) {

            let missingRequirements = false;
            let getMissingRolesAndChannels = require("../modules/methods/getMissingRolesAndChannels");

            let missingLog = []
            await getMissingRolesAndChannels(bot, message.guild).then(missing => {
                let spacing = `${chalk.gray(">")}          `

                if (missing.channels.categories.length > 0) {
                    missingLog.push(`\n${spacing}\n${spacing}${chalk.bold("Missing Categories:")}\n${spacing}${missing.channels.categories.map(c => `${c.name}${chalk.yellow(`(Setting: ${chalk.white(c.setting.join(`\n${spacing}`))})`)}`).join(`\n${spacing}`)}`)
                }
                if (missing.channels.text.length > 0) {
                    missingLog.push(`\n${spacing}\n${spacing}${chalk.bold("Missing Text Channels:")}\n${spacing}${missing.channels.text.map(c => `${c.name} ${chalk.yellow(`(Setting: ${chalk.white(c.setting.join(`\n${spacing}`))})`)}`).join(`\n${spacing}`)}`)
                }
                if (missing.channels.voice.length > 0) {
                    missingLog.push(`\n${spacing}\n${spacing}${chalk.bold("Missing Voice Channels:")}\n${spacing}${missing.channels.voice.map(c => `${c.name} ${chalk.yellow(`(Setting: ${chalk.white(c.setting.join(`\n${spacing}`))})`)}`).join(`\n${spacing}`)}`)
                }
                if (missing.roles.length > 0) {
                    missingLog.push(`\n${spacing}\n${spacing}${chalk.bold("Missing Roles:")}\n${spacing}${missing.roles.map(c => `${c.name} ${chalk.yellow(`(Setting: ${chalk.white(c.setting.join(`\n${spacing}`))})`)}`).join(`\n${spacing}`)}`)
                }
                if (missingLog.length > 0) {
                    missingRequirements = true;

                    console.log(Utils.warningPrefix + chalk.red(chalk.bold("Missing Channels or Roles: ")) + `\n${spacing}The ${chalk.bold(message.guild.name)} guild is missing roles and/or channels.${missingLog}\n${spacing}\n${spacing}${chalk.green(chalk.bold("How To Resolve:"))}\n${spacing}Run the ${chalk.bold("-setup")} command in your server, or configure the config to match your Discord\n${spacing}-----------------------------------------------------------------------------------------------------------------------`)

                    return
                }
            })

            if (missingRequirements) return;
        }

        // FILTER SYSTEM

        let filterCMD = await Utils.variables.db.get.getCommands('filter')
        if (filterCMD && filterCMD.enabled) {
            if (!Utils.hasPermission(message.member, config.Other.FilterBypassRole)) {
                const filter = await variables.db.get.getFilter();
                let words = message.content.split(" ");

                if (words.some(word => filter.map(w => w.toLowerCase()).includes(word.toLowerCase()))) {
                    message.delete();
                    if (bot.DoNotAnnounceFilter) return;
                    return message.reply(Embed({ title: lang.FilterSystem.Filter.Title, description: lang.FilterSystem.Filter.Description })).then(msg => { msg.delete({ timeout: 5000 }) });
                }
            }
        }

        // ANTI ADVERTISEMENT SYSTEM
        if (message.content && Utils.hasAdvertisement(message.content) && (command ? (command.command !== "server" && command.command !== "play") : true)) {
            if (config.AntiAdvertisement.Chat.Enabled && !Utils.hasPermission(message.member, config.AntiAdvertisement.BypassRole)) {
                let openTickets = (await Utils.getOpenTickets(message.guild)).map(c => c.id)
                let openApplications = (await Utils.getOpenApplications(message.guild)).map(c => c.id)

                if (!(openTickets.includes(message.channel.id) || openApplications.includes(message.channel.id))) {
                    if (!config.AntiAdvertisement.Whitelist.Channels.some(channel => message.channel.name == channel || message.channel.id == channel)) {
                        message.delete();

                        if (config.AntiAdvertisement.Chat.Logs.Enabled) {
                            const logs = Utils.findChannel(config.AntiAdvertisement.Chat.Logs.Channel, message.guild);

                            if (logs) logs.send(Embed({
                                title: lang.AntiAdSystem.Log.Title,
                                fields: [
                                    {
                                        name: lang.AntiAdSystem.Log.Fields[0],
                                        value: `<@${message.author.id}> (${message.author.tag})`
                                    },
                                    {
                                        name: lang.AntiAdSystem.Log.Fields[1],
                                        value: `<#${message.channel.id}>`
                                    },
                                    {
                                        name: lang.AntiAdSystem.Log.Fields[2],
                                        value: message.content
                                            .split(" ")
                                            .map(word => {
                                                if (word && Utils.hasAdvertisement(word)) return `**${word}**`;
                                                else return word;
                                            })
                                            .join(" ")
                                    }
                                ]
                            }))
                        }

                        if (bot.DoNotAnnounceAntiAd) return
                        else return message.channel.send(Embed({ title: lang.AntiAdSystem.MessageAdDetected.Title, description: lang.AntiAdSystem.MessageAdDetected.Description.replace(/{user}/g, message.author) })).then(msg => { msg.delete({ timeout: 5000 }) });

                    }
                }
            }
        }

        // UPDATES
        if ([message.channel.name, message.channel.id].includes(config.Channels.DefaultUpdates) && config.Other.PostUpdatesByMessagingInChannel && !command) {
            message.delete();
            return message.channel.send(Utils.setupEmbed({
                configPath: embeds.Embeds.Update,
                variables: [
                    ...Utils.userVariables(message.member, "user"),
                    { searchFor: /{update}/g, replaceWith: message.content }
                ]
            }))
        }

        // SUGGESTIONS SYSTEM
        if ([message.channel.name, message.channel.id].includes(config.Suggestions.Channels.Suggestions) && (command ? (command.command !== "snote") : true)) {
            if (config.Suggestions.Enabled && ['revivenode', 'send-message', 'both'].includes(config.Suggestions.Type.toLowerCase())) {
                message.delete();

                return message.channel.send(Utils.setupEmbed({
                    configPath: embeds.Embeds.Suggestion,
                    variables: [
                        ...Utils.userVariables(message.member, "user"),
                        { searchFor: /{bot-pfp}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) },
                        { searchFor: /{suggestion}/g, replaceWith: prefixFound && command ? message.content.replace(prefixFound + command, '') : message.content }
                    ]
                })).then(msg => {
                    msg.react(config.Suggestions.Emojis.Upvote);
                    msg.react(config.Suggestions.Emojis.Downvote);
                })
            }
        }

        // BUG REPORTS SYSTEM
        if ([message.channel.name, message.channel.id].includes(config.BugReports.Channels.Pending)) {
            if (config.BugReports.Enabled && ['revivenode', 'send-message', 'both'].includes(config.BugReports.Type.toLowerCase())) {
                message.delete();

                message.channel.send(Utils.setupEmbed({
                    configPath: embeds.Embeds.BugReport,
                    title: "Bug Report " + lang.MinecraftModule.Commands.BugReports.PendingSuffix,
                    color: config.BugReports.Colors.Pending,
                    variables: [
                        ...Utils.userVariables(message.member, "user"),
                        { searchFor: /{bug}/g, replaceWith: prefixFound && command ? message.content.replace(prefixFound + command, '') : message.content }
                    ]
                }))
            }
        }

        // VERIFICATION SYSTEM
        if ([message.channel.name, message.channel.id].includes(config.Verification.Code.Channel)) {
            if (config.Verification.Enabled && config.Verification.Type == "code") {
                if (!validPrefixes.map(prefix => prefix + "verify").includes(message.content)) return message.delete();
            }
        }

        // COINS SYSTEM
        let coinsModule = await Utils.variables.db.get.getModules('coins');
        if (coinsModule && coinsModule.enabled) {
            if (config.Commands.GainXP ? !validPrefixes.some(p => message.content.startsWith(p)) : true) {
                if (!cooldowns.coins.cooldown.has(message.author.id)) {
                    let addCoins = ~~(Math.random() * parseInt(config.Coins.Amounts.PerMessage)) + 1;
                    if (config.Coins.Multipliers.Multiplies.PerMessage) addCoins *= Utils.getMultiplier(message.member);

                    await variables.db.update.coins.updateCoins(message.member, addCoins, 'add');

                    if (!Utils.hasPermission(message.member, config.Cooldowns.BypassRole)) cooldowns.coins.cooldown.add(message.author.id);
                    setTimeout(function () {
                        if (!Utils.hasPermission(message.member, config.Cooldowns.BypassRole)) cooldowns.coins.cooldown.delete(message.author.id);
                    }, cooldowns.coins.cooldownSeconds * 1000);
                }
            }
        }

        // XP SYSTEM
        let expModule = await Utils.variables.db.get.getModules('exp')
        if (expModule && expModule.enabled) {
            if (![message.channel.name, message.channel.id].some(channel => config.Levels.BlacklistedChannels.includes(channel))) {
                if (config.Commands.GainXP ? !validPrefixes.some(p => message.content.startsWith(p)) : true) {
                    let { level, xp } = await variables.db.get.getExperience(message.member);
                    if (!cooldowns.xp.cooldown.has(message.author.id)) {
                        let amt = ~~(Math.random() * 10) + config.Levels.Amounts.PerMessage;
                        let xpNeeded = ~~((level * (175 * level) * 0.5)) - amt - xp;

                        if (xpNeeded <= 0) {
                            level++;

                            if (config.Levels.LevelUp.Notification) {

                                let channel = config.Levels.LevelUp.Channel == "current" ? message.channel : Utils.findChannel(config.Levels.LevelUp.Channel, message.guild);

                                if (channel) channel.send(Utils.setupEmbed({
                                    configPath: embeds.Embeds.LevelUp,
                                    variables: [
                                        { searchFor: /{level}/g, replaceWith: level },
                                        ...Utils.userVariables(message.member, "user")
                                    ]
                                })).then(msg => {
                                    if (config.Levels.LevelUp.Delete) msg.delete({ timeout: 4500 });
                                })
                            }

                            bot.emit('levelUp', message.member, level, message.channel);
                        }

                        const levelRoles = config.Levels.LevelRoles;
                        const availableLevelRoles = Object.keys(levelRoles.LevelsToRoles).filter(l => l <= level);
                        let levelRole = availableLevelRoles.length > 0 ? availableLevelRoles.reduce((a, b) => Math.abs(b - level) < Math.abs(a - level) ? b : a) : null;

                        if (levelRoles.Enabled && levelRoles.LevelsToRoles && levelRole) {
                            levelRole = levelRoles.LevelsToRoles[levelRole]

                            const role = Utils.findRole(levelRole, message.guild);
                            if (role && !message.member.roles.cache.has(role.id)) message.member.roles.add(role);

                            const roleCache = message.member.roles.cache
                            const previousRoles = Object.keys(levelRoles.LevelsToRoles)
                                .filter(l => l < level && levelRoles.LevelsToRoles[l] !== levelRole)
                                .map(l => levelRoles.LevelsToRoles[l])
                                .filter(r => roleCache.find(role => role.id == r || role.name == r))

                            if (previousRoles.length && levelRoles.RemovePrevious) {
                                previousRoles.forEach(lRole => {
                                    const previousRole = Utils.findRole(lRole, message.guild);
                                    if (previousRole) message.member.roles.remove(previousRole);
                                })
                            }
                        }

                        await variables.db.update.experience.updateExperience(message.member, level, amt, 'add');

                        if (!Utils.hasPermission(message.member, config.Cooldowns.BypassRole)) cooldowns.xp.cooldown.add(message.author.id);
                        setTimeout(function () {
                            if (!Utils.hasPermission(message.member, config.Cooldowns.BypassRole)) cooldowns.xp.cooldown.delete(message.author.id);
                        }, cooldowns.xp.cooldownSeconds * 1000);
                    }
                }
            }
        }

        const AutoResponse = config.AutoResponse;
        let autoResponded = false;
        if (AutoResponse.Enabled) {
            AutoResponse.Responses.forEach(response => {
                const matches = response.Regex ?
                    new RegExp(response.Text, 'gi').test(message.content) :
                    response.Text.toLowerCase() == message.content.toLowerCase();
                if (matches) {

                    if (response.Roles) {

                        let CantHave = response.Roles.CantHave ? response.Roles.CantHave.map(role => Utils.findRole(role, message.guild)).filter(role => role).map(role => role.id) : [];
                        let MustHave = response.Roles.MustHave ? response.Roles.MustHave.map(role => Utils.findRole(role, message.guild)).filter(role => role).map(role => role.id) : [];

                        // If they have one of the roles that they can't have
                        if (message.member.roles.cache.some(r => CantHave.includes(r.id))) return;
                        // If they don't have one of the roles they must have
                        if (!message.member.roles.cache.some(r => MustHave.includes(r.id))) return;
                    }

                    autoResponded = true;

                    if (response.Delete) message.delete();

                    const sentDM = (sent = true) => {
                        if (sent) {
                            response.AfterDM && response.AfterDM.Success ?
                                message.channel.send(Utils.Embed({
                                    title: response.AfterDM.Success,
                                    color: config.EmbedColors.Success
                                })).then(DeleteResponse)
                                : ""
                        } else {
                            response.AfterDM && response.AfterDM.Fail ?
                                message.channel.send(Utils.Embed({
                                    title: response.AfterDM.Fail,
                                    color: config.EmbedColors.Fail
                                })).then(DeleteResponse)
                                : ""
                        }
                    }

                    const DeleteResponse = (msg) => {
                        if (parseInt(response.DeleteResponse)) msg.delete({ timeout: parseInt(response.DeleteResponse) * 1000 })
                    }

                    const Replace = (text) => {
                        Utils.userVariables(message.member, "user").forEach(variable => {
                            text = text.replace(variable.searchFor, variable.replaceWith)
                        })

                        return text
                    }

                    // Text matches
                    if (response.DM) {
                        // DM the message
                        if (!response.Type || response.Type == "text") {
                            // The type of content is text
                            return message.member.send(Replace(response.Content))
                                .then(() => {
                                    sentDM()
                                })
                                .catch(() => {
                                    sentDM(false)
                                })
                        } else if (response.Type == "embed") {
                            return message.member.send(Utils.setupEmbed({
                                configPath: response.Embed, variables: [
                                    ...Utils.userVariables(message.member, "user"),
                                    { searchFor: /{bot-pfp}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) }
                                ]
                            }))
                                .then(() => {
                                    sentDM();
                                })
                                .catch(() => {
                                    sentDM(false);
                                })
                        }
                    } else {
                        if (!response.Type || response.Type == "text") {
                            // The type of content is text
                            return message.channel.send(Replace(response.Content)).then(DeleteResponse);
                        } else if (response.Type == "embed") {
                            // The type is embed
                            return message.channel.send(Utils.setupEmbed({
                                configPath: response.Embed, variables: [
                                    ...Utils.userVariables(message.member, "user"),
                                    { searchFor: /{bot-pfp}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) }
                                ]
                            })).then(DeleteResponse);
                        }
                    }
                }
            })
        }

        if (autoResponded || !prefixFound) return;

        // COMMANDS/TICKET CREATION CHANNELS
        if (config.Commands.RequireCommandsChannel && !Utils.hasPermission(message.member, config.Commands.ChannelBypassRole)) {
            if (!['install', 'verify'].includes(cmd)) {
                let validChannels = [...config.Commands.AllowedChannels];

                if (typeof config.Tickets.CreationChannel == "string") validChannels.push(config.Tickets.CreationChannel);
                if (config.Commands.AllowCommandsInTickets && message.channel.name.startsWith('ticket-')) validChannels.push(message.channel.id);

                validChannels = validChannels.filter(channel => {
                    let c = !!Utils.findChannel(channel, message.guild, 'text', true)
                    return c
                })
                validChannels = [...new Set(validChannels)];

                if (!validChannels.includes(message.channel.name) && !validChannels.includes(message.channel.id) && command) {
                    if (validChannels.length == 0) {
                        console.log(Utils.warningPrefix + "Your server requires a commands channel to be used to run commands, but it does not exist! Users will be able to run commands in all channels until the commands channel is created.")
                    } else {
                        message.delete();
                        if (['new', 'ticket'].includes(cmd)) return message.channel.send(message.member, Embed({
                            color: config.EmbedColors.Error,
                            title: lang.Other.NotCommandsChannel.Title,
                            description: lang.Other.NotCommandsChannel.Descriptions[0].replace(/{channels}/g, validChannels.map(ch => '<#' + (Utils.findChannel(ch, message.guild)).id + '>').join(", ")).replace(/{user}/g, message.member)
                        })).then(msg => msg.delete({ timeout: 5000 }));
                        else return message.channel.send(message.member, Embed({
                            color: config.EmbedColors.Error,
                            title: lang.Other.NotCommandsChannel.Title,
                            description: lang.Other.NotCommandsChannel.Descriptions[1].replace(/{channels}/g, validChannels.map(channel => '<#' + (Utils.findChannel(channel, message.guild)).id + '>').join(", ")).replace(/{user}/g, message.member)
                        })).then(msg => msg.delete({ timeout: 5000 }));
                    }
                }
            }
        }

        if (command && command.enabled && Utils.variables.commands.Enabled[command.command] !== false) {

            let commands = Utils.variables.commands;

            let permission = commands.Permissions[command.command]

            if (!permission) {
                // Checks if it's a default command and should be in the commands.yml
                // If it is not a default command and is from an addon, the addon will need to deal with permissions.
                let defaultModules = fs.readdirSync('./commands/')
                if (defaultModules.includes(command.type.toLowerCase())) {
                    permission = ["@everyone"]
                }
            }

            if (permission) {
                if (typeof permission == "string") permission = [permission]

                let role = permission.some(perm => !!Utils.findRole(perm, message.guild, false));
                let user = permission.some(perm => !!message.guild.member(perm))

                if (!role && !user) {
                    console.log(Utils.errorPrefix + `Invalid permissions were set for the ${chalk.bold(command.command)} command.\n${chalk.gray(">")}          The following role names, role IDs, or user IDs do not exist in your server:\n${chalk.gray(">")}          ` + permission.join(", "))
                    return message.channel.send(Embed({ preset: 'console' }))
                }
                if (!Utils.hasPermission(message.member, permission)) return message.channel.send(Embed({ preset: 'nopermission' }))
            }

            if (!Utils.hasPermission(message.member, config.Cooldowns.BypassRole)) {
                const cooldown = cooldowns.cmd.find(c => c.user == message.author.id && c.cmd == command.command && c.expiresAt > Date.now());

                if (cooldown) return message.channel.send(Embed({
                    title: lang.Other.Cooldown.Title,
                    color: config.EmbedColors.Error,
                    description: lang.Other.Cooldown.Description.replace(/{seconds}/g, Math.round((cooldown.expiresAt - Date.now()) / 1000))
                }))
            }

            const CommandCooldowns = config.Cooldowns.Commands;

            if (Object.keys(CommandCooldowns).find(cd => cd.toLowerCase() == command.command.toLowerCase())) {
                const cooldownSec = CommandCooldowns[command.command];

                const cooldownMs = cooldownSec * 1000;

                const cooldownObject = {
                    user: message.author.id,
                    cmd: command.command,
                    expiresAt: Date.now() + cooldownMs
                }

                cooldowns.cmd.push(cooldownObject);
                setTimeout(function () {
                    cooldowns.cmd.splice(cooldowns.cmd.indexOf(cooldownObject), 1);
                }, cooldownMs)
            }
            if (config.Commands.RemoveCommandMessages) message.delete();

            try {
                await command.run(bot, message, args, { prefixUsed: prefixFound, commandUsed: cmd });
            } catch (e) {
                console.log(Utils.errorPrefix + "An unexpected error occured while running the " + chalk.bold(command.command) + " command! Please contact the Corebot support team. " + chalk.bold("https://corebot.dev/support"))
                return require("../modules/error")(e.toString(), `Author: ${message.author.id}\nMessage: ${message.content}`, cmd.toLowerCase(), false);
            }

            if (config.Logs.Enabled.includes("Commands")) {
                let logs = Utils.findChannel(config.Logs.Channels.Commands, message.guild)
                if (logs) logs.send(Embed({
                    color: config.EmbedColors.Default,
                    title: lang.LogSystem.CommandLogs.Title,
                    fields: [{
                        name: lang.LogSystem.CommandLogs.Fields[0],
                        value: `<@${message.author.id}>`
                    }, {
                        name: lang.LogSystem.CommandLogs.Fields[1],
                        value: command.command
                    }, {
                        name: lang.LogSystem.CommandLogs.Fields[2],
                        value: message.content
                    }]
                }));
            }
        } else if (!command && config.Commands.InvalidCommandMessage) {
            commands = []
            CommandHandler.commands.forEach(cmd => {
                commands.push(cmd.command);
                cmd.aliases.forEach(alias => commands.push(alias));
            })
            let bestMatch = findBestMatch(cmd, commands).bestMatch.target
            message.channel.send(Embed({ color: config.EmbedColors.Error, title: lang.Other.InvalidCommand.Title, description: lang.Other.InvalidCommand.Description.replace(/{command}/g, prefixFound + bestMatch) }));
        }
    }
}
// 239232   SOURCE__%%   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065