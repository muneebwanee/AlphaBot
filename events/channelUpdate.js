const Utils = require('../modules/utils');
const Embed = Utils.Embed;
const { lang, config } = Utils.variables;

const getOverwrites = (channel) => {
    return channel.permissionOverwrites.map(overwrite => { const { allow, deny, type } = overwrite; return { allow, deny, type } });
}

const compareOverwrites = (original, compare) => {
    if (original.length !== compare.length) return;

    let different = false;
    compare.forEach((overwrite, i) => {
        // Get the original permission so we can compare them
        const originalPermission = original[i];

        // The parameters to compare
        const check = ["allow", "deny", "type"];
        check.forEach(c => {
            // If the parameter in the original permission does not equal the permission in the current one, set same to false
            if (originalPermission[c] !== overwrite[c])
                different = true;
        })
    })
    return different;
}
module.exports = async (bot, oldChannel, newChannel) => {
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0 && require('../modules/handlers/KeyHandler.js').verified) {
        if (!newChannel.guild || !config.Logs.Enabled.includes("ChannelUpdated")) return;
        if (config.Logs.ChannelUpdateBlacklist.some(name => oldChannel.name.toLowerCase().startsWith(name.toLowerCase()) || newChannel.name.toLowerCase().startsWith(name.toLowerCase()))) return;

        const ignore = ["channels:", "bots:", "humans:", "total members:", "status:", "online:", "ip:"]
        const logs = Utils.findChannel(config.Logs.Channels.ChannelUpdated, newChannel.guild);

        let Tickets = await Utils.getOpenTickets(newChannel.guild);
        let Applications = await Utils.getOpenApplications(newChannel.guild);
        let IDs = [...Tickets.map(channel => channel.id), ...Applications.map(channel => channel.id)];

        if (IDs.includes(newChannel.id) || ignore.some(name => oldChannel.name.toLowerCase().startsWith(name.toLowerCase()) || !logs)) return;

        if (oldChannel.name !== newChannel.name) {
            logs.send(Embed({
                title: lang.LogSystem.ChannelUpdated.NameUpdated.Title,
                fields: [
                    {
                        name: lang.LogSystem.ChannelUpdated.NameUpdated.Fields[0],
                        value: (newChannel.type === 'text') ? `<#${newChannel.id}>` : newChannel.id
                    },
                    {
                        name: lang.LogSystem.ChannelUpdated.NameUpdated.Fields[1],
                        value: oldChannel.name
                    },
                    {
                        name: lang.LogSystem.ChannelUpdated.NameUpdated.Fields[2],
                        value: newChannel.name
                    }
                ],
                timestamp: Date.now()
            }))
        }

        if (compareOverwrites(getOverwrites(oldChannel), getOverwrites(newChannel))) {
            logs.send(Embed({
                title: lang.LogSystem.ChannelUpdated.PermsUpdated.Title,
                fields: [
                    {
                        name: lang.LogSystem.ChannelUpdated.PermsUpdated.Fields[0],
                        value: (newChannel.type === 'text') ? `<#${newChannel.id}>` : newChannel.name
                    },
                    {
                        name: lang.LogSystem.ChannelUpdated.PermsUpdated.Fields[1].Name,
                        value: lang.LogSystem.ChannelUpdated.PermsUpdated.Fields[1].Value
                    }
                ],
                timestamp: Date.now()
            }))
        }

        if (oldChannel.parentID !== newChannel.parentID) {
            logs.send(Embed({
                title: lang.LogSystem.ChannelUpdated.ParentUpdated.Title,
                fields: [
                    {
                        name: lang.LogSystem.ChannelUpdated.ParentUpdated.Fields[0],
                        value: `<#${newChannel.id}>`
                    },
                    {
                        name: lang.LogSystem.ChannelUpdated.ParentUpdated.Fields[1],
                        value: (oldChannel.parent) ? oldChannel.parent.name : lang.LogSystem.ChannelUpdated.ParentUpdated.None
                    },
                    {
                        name: lang.LogSystem.ChannelUpdated.ParentUpdated.Fields[2],
                        value: (newChannel.parent) ? newChannel.parent.name : lang.LogSystem.ChannelUpdated.ParentUpdated.None
                    }
                ],
                timestamp: Date.now()
            }))
        }

        if (oldChannel.topic !== newChannel.topic) {
            logs.send(Embed({
                title: lang.LogSystem.ChannelUpdated.TopicUpdated.Title,
                fields: [
                    {
                        name: lang.LogSystem.ChannelUpdated.TopicUpdated.Fields[0],
                        value: `<#${newChannel.id}>`
                    },
                    {
                        name: lang.LogSystem.ChannelUpdated.TopicUpdated.Fields[1],
                        value: (oldChannel.topic) ? oldChannel.topic : lang.LogSystem.ChannelUpdated.TopicUpdated.None
                    },
                    {
                        name: lang.LogSystem.ChannelUpdated.TopicUpdated.Fields[2],
                        value: newChannel.topic ? newChannel.topic : lang.LogSystem.ChannelUpdated.TopicUpdated.None
                    }
                ],
                timestamp: Date.now()
            }))
        }
    }
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065