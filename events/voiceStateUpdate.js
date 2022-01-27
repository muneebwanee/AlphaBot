const Utils = require('../modules/utils.js');
const { config, usersInVoiceChannel } = Utils.variables;

module.exports = async (bot, oldState, newState) => {
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0 && require('../modules/handlers/KeyHandler.js').verified) {
        if (config.TempChannels.Enabled) {
            if (!oldState.channel && newState.channel) {
                usersInVoiceChannel.push({ user: newState.member.id, joinedAt: Date.now() });
            } else if (oldState.channel && newState.channel && oldState.channelID !== newState.channelID && usersInVoiceChannel.map(u => u.user).includes(oldState.member.id)) {
                usersInVoiceChannel.splice(usersInVoiceChannel.indexOf(usersInVoiceChannel.find(u => u.user == oldState.member.id)), 1);
                usersInVoiceChannel.push({ user: newState.member.id, joinedAt: Date.now() });
            } else if (oldState.channel && !newState.channel && usersInVoiceChannel.map(u => u.user).includes(oldState.member.id)) {
                usersInVoiceChannel.splice(usersInVoiceChannel.indexOf(usersInVoiceChannel.find(u => u.user == oldState.member.id)), 1);
            }

            let tempVC = Utils.findChannel(config.TempChannels.VoiceChannel, oldState.guild, "voice");
            let tempCategory = Utils.findChannel(config.TempChannels.Category, oldState.guild, "category");
            if (!tempVC || !tempCategory) return;

            if (tempCategory) {
                if (newState.channelID == tempVC.id) {
                    oldState.guild.channels.create(oldState.member.user.username, { type: 'voice', parent: tempCategory }).then(channel => {
                        Utils.variables.tempChannels.set(oldState.id, {
                            channel: {
                                id: channel.id,
                                name: channel.name
                            },
                            public: true,
                            allowedUsers: [ oldState.id ],
                            maxMembers: undefined
                        })
                        oldState.setChannel(channel.id);
                    })
                }
            }

            if (oldState.channel && oldState.channel !== newState.channel && oldState.channel.parentID == tempCategory.id) {
                if (oldState.channel.members.size == 0 && oldState.channelID !== tempVC.id) {
                    if (Utils.variables.tempChannels.get(oldState.id)) {
                        setTimeout(() => {
                            Utils.variables.tempChannels.delete(oldState.id)
                        }, 3000)  
                    }
                    
                    oldState.channel.delete().catch(err => { });
                }
            }
        }
    }
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065