const Utils = require('../../modules/utils');
const { lang, config, embeds } = Utils.variables;
const Embed = Utils.Embed;
module.exports = {
    name: "verify",
    run: async (bot, message, args) => {
        if (config.Verification.Enabled == false || (config.Verification.Enabled == true && config.Verification.Type !== 'code')) return;

        function generateCode(length) {
            let chars = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
            let code = '';
            for (let i = 0; i < length; i++) {
                code += chars[~~(Math.random() * chars.length)];
            }

            return code;
        }
        let channel = Utils.findChannel(config.Verification.Code.Channel, message.guild);

        if (!channel) return message.channel.send(Embed({ preset: 'console' }));
        if (message.channel.id !== channel.id) return;

        let verificationCode = generateCode(config.Verification.Code.Length >= 5 ? config.Verification.Code.Length : 5);
        let member = message.member;

        message.delete();
        await member.send(verificationCode, Embed({
            title: lang.GeneralModule.Commands.Verify.Embeds.Code.Title,
            description: lang.GeneralModule.Commands.Verify.Embeds.Code.Description.replace(/{code}/g, verificationCode).replace(/{channel}/g, `<#${channel.id}>`)
        })).then(async msg => {

            message.channel.send(`<@${message.author.id}>`, Embed({
                color: config.EmbedColors.Success,
                title: lang.GeneralModule.Commands.Verify.Sent
            })).then(m => m.delete({ timeout: 5000 }));

            await Utils.waitForResponse(message.author.id, message.channel).then(async response => {
                if (response.content == verificationCode) {
                    response.delete();
                    if (config.Verification.WelcomeMessage == "after-verified" && config.Join.Messages.Enabled) {
                        let channel = Utils.findChannel(config.Join.Messages.Channel, member.guild);
                        let invites = Utils.variables.invitedBy

                        let embed = Utils.setupEmbed({
                            configPath: embeds.Embeds.Welcome,
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
                            let role = Utils.findRole(roleName, member.guild)
                            if (role) member.roles.remove(role);
                        })
                    }

                    config.Verification.VerifiedRoles.forEach(roleName => {
                        let role = Utils.findRole(roleName, message.guild);
                        if (role) member.roles.add(role)
                    })
                } else {
                    response.delete();
                    return message.channel.send(`<@${message.author.id}>`, Embed({
                        preset: 'error',
                        description: lang.GeneralModule.Commands.Verify.Errors.InvalidCode
                    })).then(m => {
                        m.delete({ timeout: 5000 })
                    })
                }
            })
        }).catch(err => {
            if (err.name == 'DiscordAPIError' && err.code == '50007') {
                return message.channel.send(Embed({
                    preset: 'error',
                    description: lang.GeneralModule.Commands.Verify.Errors.DMsLocked
                })).then(m => m.delete({ timeout: 5000 }));
            } else {
                console.log(err)
                return message.channel.send(Embed({
                    preset: 'error',
                    description: lang.GeneralModule.Commands.Verify.Errors.ErrorOccured
                })).then(m => m.delete({ timeout: 5000 }));
            }
        })
    },
    description: "Verify that you aren't a bot account",
    usage: "verify",
    aliases: []
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065