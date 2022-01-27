const Utils = require('../modules/utils.js');
const Embed = Utils.Embed;
const lang = Utils.variables.lang;
const events = {
    MESSAGE_REACTION_ADD: 'messageReactionAdd',
    MESSAGE_REACTION_REMOVE: 'messageReactionRemove'
};

module.exports = async (bot, event) => {
    if (!["MESSAGE_REACTION_ADD", "MESSAGE_REACTION_REMOVE"].includes(event.t)) return;

    const { d: data } = event;
    const user = bot.users.cache.get(data.user_id);
    const channel = bot.channels.cache.get(data.channel_id);
    let message = await channel.messages.fetch(data.message_id);
    if (message.channel.type == 'dm') return;
    const emojiKey = (data.emoji.id) ? data.emoji.id : data.emoji.name;
    const member = message.guild.members.cache.get(user.id);
    const config = Utils.variables.config;
    const prefix = await Utils.variables.db.get.getPrefixes(message.guild.id);
    if (user.bot) return;

    if (require('../modules/handlers/CommandHandler.js').commands.length > 0 && require('../modules/handlers/KeyHandler.js').verified) {

        // HELP MENU
        if (message.embeds.length > 0 && message.embeds[0].title && config.Other.HelpMenu == "categorized" && event.t == "MESSAGE_REACTION_ADD") {
            let normalHelpMenuCategories = lang.Help.CategoryMenuTitles.slice(3);
            let staffHelpMenuCategories = lang.Help.CategoryMenuTitles.slice(0, 3);

            normalHelpMenuCategories.splice(7, 1);
            normalHelpMenuCategories.push("Music Commands");
            staffHelpMenuCategories.push(lang.Help.CategoryMenuTitles[10]);

            if ((normalHelpMenuCategories.some(catTitle => message.embeds[0].title == lang.Help.HelpMenuTitle + ' - ' + catTitle) || message.embeds[0].title == lang.Help.HelpMenuTitle) ||
                (staffHelpMenuCategories.some(catTitle => message.embeds[0].title == lang.Help.StaffHelpMenuTitle + ' - ' + catTitle) || message.embeds[0].title == lang.Help.StaffHelpMenuTitle)) {

                let CommandList = require("../modules/methods/generateHelpMenu");
                if (!CommandList.normal || !CommandList.staff) await CommandList.setup();

                let embeds = {
                    mod: Embed({
                        title: lang.Help.StaffHelpMenuTitle + ' - ' + lang.Help.CategoryMenuTitles[0],
                        description: CommandList.staff.mod.replace(/{prefix}/g, prefix)
                    }),
                    admin: Embed({
                        title: lang.Help.StaffHelpMenuTitle + ' - ' + lang.Help.CategoryMenuTitles[1],
                        description: CommandList.staff.admin.replace(/{prefix}/g, prefix)
                    }),
                    management: Embed({
                        title: lang.Help.StaffHelpMenuTitle + ' - ' + lang.Help.CategoryMenuTitles[2],
                        description: CommandList.staff.management.replace(/{prefix}/g, prefix)
                    }),
                    general: Embed({
                        title: lang.Help.HelpMenuTitle + ' - ' + lang.Help.CategoryMenuTitles[3],
                        description: CommandList.normal.general.replace(/{prefix}/g, prefix)
                    }),
                    tickets: Embed({
                        title: lang.Help.HelpMenuTitle + ' - ' + lang.Help.CategoryMenuTitles[4],
                        description: CommandList.normal.tickets.replace(/{prefix}/g, prefix)
                    }),
                    coins: Embed({
                        title: lang.Help.HelpMenuTitle + ' - ' + lang.Help.CategoryMenuTitles[5],
                        description: CommandList.normal.coins.replace(/{prefix}/g, prefix)
                    }),
                    exp: Embed({
                        title: lang.Help.HelpMenuTitle + ' - ' + lang.Help.CategoryMenuTitles[6],
                        description: CommandList.normal.exp.replace(/{prefix}/g, prefix)
                    }),
                    other: Embed({
                        title: lang.Help.HelpMenuTitle + ' - ' + lang.Help.CategoryMenuTitles[7],
                        description: CommandList.normal.other.replace(/{prefix}/g, prefix)
                    }),
                    help: Utils.setupEmbed({
                        configPath: Utils.variables.embeds.Embeds.CategorizedHelp,
                        title: lang.Help.HelpMenuTitle,
                        variables: [
                            { searchFor: /{prefix}/g, replaceWith: prefix }
                        ]
                    }),
                    staff: Utils.setupEmbed({
                        configPath: Utils.variables.embeds.Embeds.CategorizedStaffHelp,
                        title: lang.Help.StaffHelpMenuTitle,
                        variables: [
                            { searchFor: /{prefix}/g, replaceWith: prefix }
                        ]
                    }),
                    fun: Embed({
                        title: lang.Help.HelpMenuTitle + ' - ' + lang.Help.CategoryMenuTitles[8],
                        description: CommandList.normal.fun.replace(/{prefix}/g, prefix)
                    }),
                    minecraft: Embed({
                        title: lang.Help.HelpMenuTitle + ' - ' + lang.Help.CategoryMenuTitles[9],
                        description: CommandList.normal.minecraft.replace(/{prefix}/g, prefix)
                    }),
                    giveaways: Embed({
                        title: lang.Help.StaffHelpMenuTitle + ' - ' + lang.Help.CategoryMenuTitles[10],
                        description: CommandList.staff.giveaways.replace(/{prefix}/g, prefix)
                    }),
                    music: Embed({
                        title: lang.Help.HelpMenuTitle + ' - ' + "Music Commands",
                        description: CommandList.normal.music.replace(/{prefix}/g, prefix)
                    }),
                }

                let edit = (emoji, type) => {
                    message.edit(embeds[type]);
                    message.reactions.cache.get(emoji).users.remove(user);
                    message.react('🔙');
                }

                let check = async (type) => {
                    if (((CommandList.normal[type] && CommandList.normal[type].length > 0) || (CommandList.staff[type] && CommandList.staff[type].length > 0))) {
                        let module = await Utils.variables.db.get.getModules(type)
                        if (module && module.enabled) edit(emojiKey, type)
                    }
                }

                if (normalHelpMenuCategories.some(catTitle => message.embeds[0].title == lang.Help.HelpMenuTitle + ' - ' + catTitle) || message.embeds[0].title == lang.Help.HelpMenuTitle) {
                    let helpCMD = await Utils.variables.db.get.getCommands('help');
                    if (!helpCMD || (helpCMD && !helpCMD.enabled)) return;

                    if (emojiKey == "🙂") return check("general")
                    if (emojiKey == "🎟️") return check("tickets")
                    if (emojiKey == "💰") return check("coins")
                    if (emojiKey == "🗂️") return check("other")
                    if (emojiKey == "✨") return check("exp")
                    if (emojiKey == "🎮") return check("fun")
                    if (emojiKey == "⛏️") return check("minecraft")
                    if (emojiKey == "🎵") return check("music")
                    if (emojiKey == '🔙') {
                        message.edit(embeds.help);
                        return message.reactions.cache.get('🔙').remove();

                    }
                } else if (staffHelpMenuCategories.some(catTitle => message.embeds[0].title == lang.Help.StaffHelpMenuTitle + ' - ' + catTitle) || message.embeds[0].title == lang.Help.StaffHelpMenuTitle) {
                    let staffHelpCMD = await Utils.variables.db.get.getCommands('staffhelp');
                    if (!staffHelpCMD || (staffHelpCMD && !staffHelpCMD.enabled)) return;

                    if (emojiKey == "👮") return check("mod")
                    if (emojiKey == "🛠") return check("admin")
                    if (emojiKey == "🎉") return check("giveaways")
                    if (emojiKey == "🖥️") return check("management")
                    if (emojiKey == '🔙') {
                        message.edit(embeds.staff);
                        return message.reactions.cache.get('🔙').remove()
                    }
                }
            }

        }

        // GIVEAWAYS
        if (emojiKey == config.Other.Giveaways.UnicodeEmoji) {
            const giveawaysModule = await Utils.variables.db.get.getModules('giveaways')
            if (giveawaysModule && giveawaysModule.enabled) {
                const Giveaway = await Utils.variables.db.get.getGiveaways(message.id);
                if (Giveaway && !Giveaway.ended) {
                    if (event.t == "MESSAGE_REACTION_ADD") {
                        bot.emit("giveawayJoined", member, message, Giveaway);
                        Utils.variables.db.update.giveaways.reactions.addReaction(message.id, user.id);
                    }
                    if (event.t == "MESSAGE_REACTION_REMOVE") {
                        bot.emit("giveawayLeft", member, message, Giveaway);
                        Utils.variables.db.update.giveaways.reactions.removeReaction(message.id, user.id);
                    }
                }
            }
        }

        // ROLE MENU
        if (message.embeds.length > 0 && message.embeds[0].title && Array.isArray(config.ReactionRoles)) {
            const menu = config.ReactionRoles.find(menu => menu.Embed.Title == message.embeds[0].title)
            const emoji = menu ? Object.keys(menu.EmojisToRoles).find(emoji => emoji === emojiKey) : undefined
            if (menu && emoji) {
                const role = Utils.findRole(menu.EmojisToRoles[emoji], message.guild);
                if (role) {
                    if (event.t == "MESSAGE_REACTION_ADD") {
                        if (!member.roles.cache.has(role.id)) {
                            if (menu.OnlyOne) {
                                let roleToRemove = Object.values(menu.EmojisToRoles).find(roleName => Utils.hasRole(member, roleName, false));
                                let emojiToRemove = Object.keys(menu.EmojisToRoles)[Object.values(menu.EmojisToRoles).indexOf(roleToRemove)];
                                if (roleToRemove) message.reactions.cache.get(emojiToRemove).users.remove(member)
                            }

                            await member.roles.add(role);

                            member.send(Embed({ title: lang.AdminModule.Commands.Rolemenu.RoleAdded.replace(/{role}/g, menu.EmojisToRoles[emoji]) })).catch(err => { });
                            bot.emit("roleMenuRoleAdded", member, menu, role);
                        }
                    } else {
                        if (member.roles.cache.has(role.id)) {
                            await member.roles.remove(role);

                            member.send(Embed({ title: lang.AdminModule.Commands.Rolemenu.RoleRemoved.replace(/{role}/g, menu.EmojisToRoles[emoji]) })).catch(err => { });
                            bot.emit("roleMenuRoleRemoved", member, menu, role);
                        }
                    }
                } else {
                    member.send(Embed({
                        color: config.EmbedColors.Error,
                        title: lang.AdminModule.Commands.Rolemenu.RoleNotExist.replace(/{role}/g, menu.EmojisToRoles[emoji])
                    })).catch(err => { })
                }
            }
        }

        // VERIFICATION
        if (config.Verification.Enabled == true
            && event.t == "MESSAGE_REACTION_ADD"
            && config.Verification.Type == 'reaction'
            && message.id == config.Verification.Reaction.MessageID
            && emojiKey == config.Verification.Reaction.Emoji) {

            message.react(config.Verification.Reaction.Emoji);
            message.reactions.cache.find(reaction => reaction.emoji.name == emojiKey || reaction.emoji.id == emojiKey).users.remove(user);

            if (config.Verification.WelcomeMessage == "after-verified" && config.Join.Messages.Enabled) {
                let channel = Utils.findChannel(config.Join.Messages.Channel, member.guild);
                let invites = Utils.variables.invitedBy

                let embed = Utils.setupEmbed({
                    configPath: Utils.variables.embeds.Embeds.Welcome,
                    variables: [
                        ...Utils.userVariables(member, "user"),
                        { searchFor: /{total}/g, replaceWith: member.guild.memberCount },
                        { searchFor: /{bot-pfp}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) },
                        { searchFor: /{inviter}/g, replaceWith: invites ? invites.has(member.id) ? invites.get(member.id).tag : "Unknown" : "Unknown" }]
                })

                if (channel) channel.send(embed);
                if (config.Join.Messages.DM.Enabled) member.send(embed).catch(err => { })
            }

            if (config.Join.Roles) {
                config.Join.Roles.forEach(roleName => {
                    let role = Utils.findRole(roleName, member.guild);
                    if (role) member.roles.remove(role);
                })
            }

            config.Verification.VerifiedRoles.forEach(roleName => {
                let role = Utils.findRole(roleName, member.guild);
                if (role) member.roles.add(role);
            })
        }

        // SUGGESTIONS
        if (config.Suggestions.Enabled == true && event.t == "MESSAGE_REACTION_ADD") {
            let channels = [config.Suggestions.Channels.Suggestions, config.Suggestions.Channels.Accepted, config.Suggestions.Channels.Denied, config.Suggestions.Channels.Implemented]
            if (channels.includes(channel.id) || channels.includes(channel.name)) {
                if (message.embeds.length > 0) {
                    let embed = message.embeds[0];
                    let settings = {};

                    if (emojiKey == config.Suggestions.Emojis.Upvote && embed.footer.text.replace('From: ', '') == member.user.tag) {
                        return message.channel.send(Embed({ preset: 'error', description: lang.GeneralModule.Commands.Suggest.ReactToOwnSuggestion })).then(msg => {
                            msg.delete({ timeout: 2500 });
                            message.reactions.cache.find(reaction => reaction.emoji.name == emojiKey || reaction.emoji.id == emojiKey).users.remove(user);
                        });
                    }
                    else if (emojiKey == config.Suggestions.Emojis.Downvote && embed.footer.text.replace('From: ', '') == member.user.tag) {
                        return message.channel.send(Embed({ preset: 'error', description: lang.GeneralModule.Commands.Suggest.ReactToOwnSuggestion })).then(msg => {
                            msg.delete({ timeout: 2500 });
                            message.reactions.cache.find(reaction => reaction.emoji.name == emojiKey || reaction.emoji.id == emojiKey).users.remove(user);
                        });
                    }

                    if (!Utils.findRole(config.Suggestions.ManageSuggestionsRole, message.guild) || !Utils.hasPermission(member, config.Suggestions.ManageSuggestionsRole)) return;

                    if (emojiKey == config.Suggestions.Emojis.Deny) settings = {
                        title: lang.GeneralModule.Commands.Suggest.DeniedSuffix,
                        channel: Utils.findChannel(config.Suggestions.Channels.Denied.toString(), message.guild, 'text', false),
                        color: config.Suggestions.Colors.Denied
                    }
                    else if (emojiKey == config.Suggestions.Emojis.Accept) settings = {
                        title: lang.GeneralModule.Commands.Suggest.AcceptedSuffix,
                        channel: Utils.findChannel(config.Suggestions.Channels.Accepted.toString(), message.guild, 'text', false),
                        color: config.Suggestions.Colors.Accepted
                    }
                    else if (emojiKey == config.Suggestions.Emojis.Implemented) settings = {
                        title: lang.GeneralModule.Commands.Suggest.ImplementedSuffix,
                        channel: Utils.findChannel(config.Suggestions.Channels.Implemented.toString(), message.guild, 'text', false),
                        color: config.Suggestions.Colors.Implemented
                    }
                    else if (emojiKey == config.Suggestions.Emojis.Reset) settings = {
                        title: '',
                        channel: Utils.findChannel(config.Suggestions.Channels.Suggestions.toString(), message.guild, 'text', false),
                        color: config.Suggestions.Colors.Pending,
                        react: true
                    }
                    else return;

                    message.reactions.cache.find(reaction => reaction.emoji.name == emojiKey || reaction.emoji.id == emojiKey).users.remove(user);

                    let title = embed.title ? embed.title : ''
                    let suffixes = [lang.GeneralModule.Commands.Suggest.DeniedSuffix, lang.GeneralModule.Commands.Suggest.AcceptedSuffix, lang.GeneralModule.Commands.Suggest.ImplementedSuffix]
                    suffixes.forEach(suffix => {
                        title = title.replace(new RegExp(suffix.replace("|", "\\|"), 'g'), '')
                    })
                    title = `${title} ${settings.title}`.replace(/\s+/g, ' ').trim();

                    if (embed.title) embed.title = title;
                    embed.color = settings.color;

                    if (settings.channel && channel.name !== settings.channel.name) {
                        message.delete();
                        message = await settings.channel.send(embed);
                    } else message.edit(embed)

                    if (settings.react) {
                        message.react(config.Suggestions.Emojis.Upvote)
                        message.react(config.Suggestions.Emojis.Downvote)
                    }
                    return;
                }
            }
        }

        // BUG REPORTS
        if (config.BugReports.Enabled == true && event.t == "MESSAGE_REACTION_ADD") {
            if (!Utils.findRole(config.BugReports.ManageBugReportsRole, message.guild) || !Utils.hasPermission(member, config.BugReports.ManageBugReportsRole)) return;
            let channels = [config.BugReports.Channels.Pending, config.BugReports.Channels.Accepted, config.BugReports.Channels.Denied, config.BugReports.Channels.Fixed]
            if (channels.includes(channel.id) || channels.includes(channel.name)) {
                if (message.embeds.length > 0) {
                    let embed = message.embeds[0];
                    let settings = {};

                    if (emojiKey == config.BugReports.Emojis.Deny) settings = {
                        title: lang.MinecraftModule.Commands.BugReports.DeniedSuffix,
                        channel: Utils.findChannel(config.BugReports.Channels.Denied.toString(), message.guild, 'text', false),
                        color: config.BugReports.Colors.Denied
                    }
                    else if (emojiKey == config.BugReports.Emojis.Accept) settings = {
                        title: lang.MinecraftModule.Commands.BugReports.AcceptedSuffix,
                        channel: Utils.findChannel(config.BugReports.Channels.Accepted.toString(), message.guild, 'text', false),
                        color: config.BugReports.Colors.Accepted
                    }
                    else if (emojiKey == config.BugReports.Emojis.Fixed) settings = {
                        title: lang.MinecraftModule.Commands.BugReports.FixedSuffix,
                        channel: Utils.findChannel(config.BugReports.Channels.Fixed.toString(), message.guild, 'text', false),
                        color: config.BugReports.Colors.Fixed
                    }
                    else if (emojiKey == config.BugReports.Emojis.Reset) settings = {
                        title: lang.MinecraftModule.Commands.BugReports.PendingSuffix,
                        channel: Utils.findChannel(config.BugReports.Channels.Pending.toString(), message.guild, 'text', false),
                        color: config.BugReports.Colors.Pending
                    }
                    else return;

                    message.reactions.cache.find(reaction => reaction.emoji.name == emojiKey || reaction.emoji.id == emojiKey).users.remove(user);

                    let title = embed.title ? embed.title : ''
                    let suffixes = [lang.MinecraftModule.Commands.BugReports.DeniedSuffix, lang.MinecraftModule.Commands.BugReports.AcceptedSuffix, lang.MinecraftModule.Commands.BugReports.FixedSuffix, lang.MinecraftModule.Commands.BugReports.PendingSuffix]
                    suffixes.forEach(suffix => {
                        title = title.replace(new RegExp(suffix.replace("|", "\\|"), 'g'), '')
                    })
                    title = `${title} ${settings.title}`.replace(/\s+/g, ' ').trim();

                    if (embed.title) embed.title = title;
                    embed.color = settings.color;

                    if (settings.channel && channel.name !== settings.channel.name) {
                        message.delete();
                        message = await settings.channel.send(embed);
                    } else message.edit(embed)

                    return;
                }
            }
        }

        // APPLY
        /*if (await Utils.variables.db.get.getCommands('apply') && (await Utils.variables.db.get.getCommands('apply')).enabled) {
            let lastMessage = await channel.messages.fetch(channel.lastMessageID);
            if (lastMessage.embeds.length > 0 && lastMessage.embeds[0].title == lang.Other.OtherCommands.Apply.Embeds.Accepted.Title) return;
            const applications_category = Utils.findChannel(config.Applications.Category, message.guild, 'category');
            if (channel.parentID == (applications_category ? applications_category.id : 0) && message.embeds.length > 0 && event.t == "MESSAGE_REACTION_ADD") {
                const messageEmbed = message.embeds[0];
                if (messageEmbed.title == config.Applications.Application_Complete.Title && messageEmbed.description == config.Applications.Application_Complete.Description) {
                    if (!Utils.hasPermission(member, config.Applications.Reviewer_Role)) {
                        message.reactions.cache.get(emojiKey).users.remove(member.id);
                    } else {
                        const applyingUser = message.guild.member(channel.topic.split("\n")[1].split(": ")[1]);
                        // Be sure the user is still in the server
                        if (!applyingUser) return message.channel.send(lang.Other.OtherCommands.Apply.Errors.UserLeft);
    
                        let lastMessage = await channel.messages.fetch(channel.lastMessageID);
                        if (emojiKey == "❌") {
                            if (lastMessage.embeds.length > 0 && lastMessage.embeds[0].title == lang.Other.OtherCommands.Apply.Embeds.Denied.Title) return;
                            const embed = Utils.Embed({ title: lang.Other.OtherCommands.Apply.Embeds.Denied.Title, description: lang.Other.OtherCommands.Apply.Embeds.Denied.Description, color: config.Error_Color });
                            if (config.Applications.DM_Decision) applyingUser.send(embed).catch(error => message.channel.send(lang.Other.OtherCommands.Apply.Errors.CantNotify));
                            channel.send(`<@${applyingUser.id}>`, { embed: embed.embed });
    
                            bot.emit("applicationDenied", member, message, applyingUser);
                        } else if (emojiKey == "✅") {
                            if (lastMessage.embeds.length > 0 && lastMessage.embeds[0].title == lang.Other.OtherCommands.Apply.Embeds.Accepted.Title) return;
                            const applyingUser = message.guild.member(channel.topic.split("\n")[1].split(": ")[1]);
                            // Be sure the user is still in the server
                            if (!applyingUser) return message.channel.send(lang.Other.OtherCommands.Apply.Errors.UserLeft);
    
                            // Get all positions
                            const validPositions = config.Applications.Positions;
    
                            const position = validPositions[channel.topic.split("\n")[2].split(": ")[1]];
    
                            // Cancel if the position no longer exists
                            if (!position) return message.channel.send(lang.Other.OtherCommands.Apply.Errors.PositionNotFound.replace(/{pos}/g, channel.topic.split("\n")[2].split(": ")[1] + "``"));
    
                            if (config.Applications.Add_Role_When_Accepted) {
                                // Find the role
                                const role = Utils.findRole(position.Role, channel.guild);
    
                                if (!role) message.channel.send(lang.Other.OtherCommands.Apply.RoleNotFound.replace(/{role}/g, position.Role))
                                else applyingUser.roles.add(role);
                            }
    
                            const embed = Utils.Embed({ title: lang.Other.OtherCommands.Apply.Embeds.Accepted.Title, description: lang.Other.OtherCommands.Apply.Embeds.Accepted.Description, color: config.Success_Color });
                            if (config.Applications.DM_Decision) applyingUser.send(embed).catch(error => message.channel.send(lang.Other.OtherCommands.Apply.Errors.CantNotify));
                            channel.send(`<@${applyingUser.id}>`, { embed: embed.embed });
    
                            bot.emit("applicationAccepted", member, message, applyingUser);
                        } else if (emojiKey == "🗑️") {
                            let logs = Utils.findChannel(config.Applications.Logs.Channel, message.guild);
                            let applyingUser = message.guild.member(channel.topic.split("\n")[1].split(": ")[1]) || channel.topic.split('\n')[0].split(' : ')[1];
                            if (!logs) return message.channel.send(Embed({ preset: 'console' }));
                            logs.send(Embed({ title: lang.Other.OtherCommands.Apply.Embeds.Closed.Title, fields: [{ name: lang.Other.OtherCommands.Apply.Embeds.Closed.Field, value: ((applyingUser.user) ? `<@${applyingUser.id}>` : applyingUser) }] }));
                            channel.delete();
                        }
                    }
                }
            }
        }*/
    }
}
// 239232   8501   2161065    52657   TAMP__%%   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065