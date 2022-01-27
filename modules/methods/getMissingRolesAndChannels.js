const Utils = require('../utils');
const config = Utils.variables.config;
const commandsYML = Utils.variables.commands;

module.exports = async (bot, guild) => {
    return new Promise(async resolve => {
        let corebotCategories = []
        let corebotTextChannels = []
        let corebotVoiceChannels = []
        let corebotRoles = [];

        let modules = {}
        let commands = {}

        let Modules = await Utils.variables.db.get.getModules()
        Modules.forEach(m => {
            modules[m.name] = m.enabled
        })

        let Commands = await Utils.variables.db.get.getCommands()
        Commands.forEach(command => {
            commands[command.name] = command.enabled
        })

        if (modules.coins == undefined) modules.coins = true
        if (modules.exp == undefined) modules.exp = true
        if (modules.tickets == undefined) modules.tickets = true
        if (modules.mod == undefined) modules.mod = true

        if (commands.apply == undefined) modules.apply = true
        if (commands.mute == undefined) modules.mute = true
        if (commands.lock == undefined) modules.lock = true
        if (commands.rolemenu == undefined) modules.rolemenu = true
        if (commands.report == undefined) modules.report = true
        if (commands.vote == undefined) modules.vote = true
        if (commands.update == undefined) modules.update = true
        if (commands.announce == undefined) modules.announce = true
        if (commands.filter == undefined) modules.filter = true

        if (Array.isArray(config.Join.Roles)) corebotRoles.push(...config.Join.Roles.map(role => { return { name: role, setting: "config -> Join -> Roles" } }))
        if (config.Join.Messages.Enabled) corebotTextChannels.push({ name: config.Join.Messages.Channel, setting: "config -> Join -> Messages -> Channel" })
        if (config.Join.InviteRewards.Enable && typeof config.Join.InviteRewards.Roles == "object") corebotRoles.push(...Object.values(config.Join.InviteRewards.Roles).map(role => { return { name: role, setting: "config -> Join -> InviteRewards -> Roles" } }))
        if (config.Leave.Messages.Enabled) corebotTextChannels.push({ name: config.Leave.Messages.Channel, setting: "config -> Leave -> Messages -> Channel" })
        
        if (modules.coins) {
            if (config.Coins.Shop.Enabled && Array.isArray(config.Coins.Shop.Items)) {
                config.Coins.Shop.Items.forEach(item => {
                    corebotRoles.push({ name: item.Role, setting: `config -> Coins -> Shop -> Items -> ${item.Name} -> Role` })

                    if (item.Requirements && item.Requirements.Role) corebotRoles.push({ name: item.Requirements.Role, setting: `config -> Coins -> Shop -> Items -> ${item.Name} -> Requirements -> Role` })
                })
            }

            if (config.Coins.Multipliers.Enabled && typeof config.Coins.Multipliers.Roles == "object") {
                corebotRoles.push(...Object.values(config.Coins.Multipliers.Roles))
            }
        }

        if (modules.exp) {
            if (config.Levels.LevelRoles.Enabled && typeof config.Levels.LevelRoles.LevelsToRoles == "object") {
                corebotRoles.push(...Object.values(config.Levels.LevelRoles.LevelsToRoles).map(role => { return { name: role, setting: "config -> Levels -> LevelRoles -> LevelsToRoles" } }))
            }
            if (config.Levels.LevelUp.Notification && config.Levels.LevelUp.Channel !== "current") corebotTextChannels.push({ name: config.Levels.LevelUp.Channel, setting: "config -> Levels -> LevelUp -> Channel" })
        }

        if (modules.tickets) {
            corebotRoles.push({ name: config.Tickets.SupportRole, setting: "config -> Tickets -> SupportRole" })
            corebotCategories.push({ name: config.Tickets.Channel.Category, setting: "config -> Tickets -> Channel -> Category" })
            if (config.Tickets.Logs.Enabled) corebotTextChannels.push({ name: config.Tickets.Logs.Channel, setting: "config -> Tickets -> Logs -> Channel" })
            if (config.Tickets.Transcripts.Enabled) corebotTextChannels.push({ name: config.Tickets.Transcripts.Channel, setting: "config -> Tickets -> Transcripts -> Channel" })
        }
        
        if (config.AntiAdvertisement.Chat.Enabled || config.AntiAdvertisement.Status.Enabled) corebotRoles.push({ name: config.AntiAdvertisement.BypassRole, setting: "config -> AntiAdvertisement -> BypassRole" })
        if (config.AntiAdvertisement.Chat.Enabled && config.AntiAdvertisement.Chat.Logs.Enabled) corebotTextChannels.push({ name: config.AntiAdvertisement.Chat.Logs.Channel, setting: "config -> AntiAdvertisement -> Chat -> Logs -> Channel" })
        if (config.AntiAdvertisement.Status.Enabled) corebotTextChannels.push({ name: config.AntiAdvertisement.Status.Channel, setting: "config -> AntiAdvertisement -> Status -> Channel" })

        if (config.Verification.Enabled) {
            if (Array.isArray(config.Verification.VerifiedRoles)) corebotRoles.push(...config.Verification.VerifiedRoles.map(role => { return { name: role, setting: "config -> Verification -> VerifiedRoles" } }))
            if (config.Verification.Type.toLowerCase() == "code") corebotTextChannels.push({ name: config.Verification.Code.Channel, setting: "config -> Verification -> Code -> Channel" })
        }

        if (config.TempChannels.Enabled) {
            corebotCategories.push({ name: config.TempChannels.Category, setting: "config -> TempChannels -> Category" })
            corebotVoiceChannels.push({ name: config.TempChannels.VoiceChannel, setting: "config -> TempChannels -> VoiceChannel" })
        }
        
        if (config.Suggestions.Enabled) corebotRoles.push({ name: config.Suggestions.ManageSuggestionsRole, setting: "config -> Suggestions -> ManageSuggestionsRole" })
        if (config.BugReports.Enabled) corebotRoles.push({ name: config.BugReports.ManageBugReportsRole, setting: "config -> BugReports -> ManageBugReportsRole" })
        if (config.Suggestions.Enabled) corebotTextChannels.push(...Object.values(config.Suggestions.Channels).map(channel => { return { name: channel, setting: "config -> Suggestions -> Channels" } }))
        if (config.BugReports.Enabled) corebotTextChannels.push(...Object.values(config.BugReports.Channels).map(channel => { return { name: channel, setting: "config -> BugReports -> Channels" } }))

        if (commands.apply) {
            corebotRoles.push(config.Applications.ReviewerRole)
            corebotCategories.push({ name: config.Applications.Channel.Category, setting: "config -> Applications -> Channel -> Category" })
            if (config.Applications.Logs.Enabled) corebotTextChannels.push({ name: config.Applications.Logs.Enabled, setting: "config -> Applications -> Logs -> Enabled" })
            if (config.Applications.Transcripts.Enabled) corebotTextChannels.push({ name: config.Applications.Transcripts.Enabled, setting: "config -> Applications -> Transcripts -> Enabled" })
            if (typeof config.Applications.Positions == "object") Object.values(config.Applications.Positions).forEach(position => {
                if (position.Role) corebotRoles.push({ name: position.Role, setting: "config -> Applications -> Positions" })
            })
        }
        
        if (modules.mod) {
            if (commands.mute) corebotRoles.push({ name: config.Moderation.MuteRole, setting: "config -> Moderation -> MuteRole" })
            if (config.Moderation.Logs.Enabled) corebotTextChannels.push({ name: config.Moderation.Logs.Channel, settings: "config -> Moderation -> Logs -> Channel" })
        }

        if (config.AutoAnnouncements.Enabled) {
            if (Array.isArray(config.AutoAnnouncements.Announcements)) config.AutoAnnouncements.Announcements.forEach(announcement => {
                corebotTextChannels.push({ name: announcement.Channel, setting: "config -> AutoAnnouncements -> Announcements" })
            })
        }
        
        if (typeof config.Logs.Channels == "object") Object.keys(config.Logs.Channels).forEach(logName => {
            if (Array.isArray(config.Logs.Enabled) && config.Logs.Enabled.includes(logName)) corebotTextChannels.push({ name: config.Logs.Channels[logName], setting: `config -> Logs -> Channels -> ${logName}` })
        })

        if (commands.lock) {
            if (Array.isArray(config.LockUnlock.Whitelisted)) corebotRoles.push(...config.LockUnlock.Whitelisted.map(role => { return { name: role, setting: "config -> LockUnlock -> Whitelisted" } }))
            if (Array.isArray(config.LockUnlock.Ignore)) corebotRoles.push(...config.LockUnlock.Ignore.map(role => { return { name: role, setting: "config -> LockUnlock -> Ignore" } }))
        }

        if (commands.rolemenu && Array.isArray(config.ReactionRoles)) config.ReactionRoles.forEach(menu => {
            corebotRoles.push(...Object.values(menu.EmojisToRoles).map(role => { return { name: role, setting: `config -> ReactionRoles -> ${menu.Name} -> EmojisToRole` } }))
        })

        if (config.Commands.RequireCommandsChannel) {
            if (Array.isArray(config.Commands.AllowedChannels)) corebotTextChannels.push(...config.Commands.AllowedChannels.map(channel => { return { name: channel, setting: "config -> Commands -> AllowedChannels" } }))
            corebotRoles.push({ name: config.Commands.ChannelBypassRole, setting: "config -> Commands -> ChannelBypassRole" })
        }
        
        if (config.Cooldowns.Experience || config.Cooldowns.Coins || Object.values(config.Cooldowns.Commands).some(c => c)) corebotRoles.push({ name: config.Cooldowns.BypassRole, setting: "config -> Cooldowns -> BypassRole" })
        if (commands.report) corebotTextChannels.push({ name: config.Channels.Reports, setting: "config -> Channels -> Reports" })
        if (commands.vote) corebotTextChannels.push({ name: config.Channels.DefaultVote, setting: "config -> Channels -> DefaultVote" })
        if (commands.update) corebotTextChannels.push({ name: config.Channels.DefaultUpdates, setting: "config -> Channels -> DefaultUpdates" })
        if (commands.announce) corebotTextChannels.push({ name: config.Channels.DefaultAnnouncements, setting: "config -> Channels -> DefaultAnnouncements" })
        if (commands.filter) corebotRoles.push({ name: config.Other.FilterBypassRole, setting: "config -> Other -> FilterBypassRole" })

        let commandPermissions = []
        
        Object.keys(commandsYML.Permissions)
            .filter(commandName => commands[commandName])
            .forEach(commandName => { 
                commandPermissions.push(...commandsYML.Permissions[commandName].map(perm => { return { name: perm, setting: `commands -> Permissions -> ${commandName}`}}))
             })


        commandPermissions = commandPermissions.filter(perm => {
            return perm.name !== "@everyone" && !/[0-9]{18}/.test(perm.name)
        })

        corebotRoles.push(...commandPermissions)

        corebotCategories = corebotCategories.filter(category => typeof category.name == 'string');
        corebotTextChannels = corebotTextChannels.filter(ch => typeof ch.name == 'string');
        corebotVoiceChannels = corebotVoiceChannels.filter(vc => typeof vc.name == 'string');
        corebotRoles = corebotRoles.filter(role => typeof role.name == 'string');

        let mergedRoles = [];
        let mergedCategories = [];
        let mergedTextChannels = [];
        let mergedVoiceChannels = [];

        corebotRoles.forEach(role => {
            let roles = corebotRoles.filter(r => r.name == role.name);
            
            if (mergedRoles.find(r => r.name == role.name)) return
            else mergedRoles.push({ name: role.name, setting: roles.map(r => r.setting) })
        })

        corebotCategories.forEach(channel => {
            let channels = corebotCategories.filter(r => r.name == channel.name);

            if (mergedCategories.find(r => r.name == channel.name)) return
            else mergedCategories.push({ name: channel.name, setting: channels.map(r => r.setting) })
        })

        corebotTextChannels.forEach(channel => {
            let channels = corebotTextChannels.filter(r => r.name == channel.name);

            if (mergedTextChannels.find(r => r.name == channel.name)) return
            else mergedTextChannels.push({ name: channel.name, setting: channels.map(r => r.setting) })
        })

        corebotVoiceChannels.forEach(channel => {
            let channels = corebotVoiceChannels.filter(r => r.name == channel.name);

            if (mergedVoiceChannels.find(r => r.name == channel.name)) return
            else mergedVoiceChannels.push({ name: channel.name, setting: channels.map(r => r.setting) })
        })

        mergedCategories = mergedCategories.filter(category => {
            return !Utils.findChannel(category.name, guild, 'category', false);
        })
        mergedTextChannels = mergedTextChannels.filter(channel => {
            return !Utils.findChannel(channel.name, guild, 'text', false);
        })
        mergedVoiceChannels = mergedVoiceChannels.filter(channel => {
            return !Utils.findChannel(channel.name, guild, 'voice', false);
        })
        mergedRoles = mergedRoles.filter(role => {
            return !Utils.findRole(role.name, guild, false);
        })

        resolve({
            roles: mergedRoles,
            channels: {
                text: mergedTextChannels,
                voice: mergedVoiceChannels,
                categories: mergedCategories
            }
        })
    })
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065