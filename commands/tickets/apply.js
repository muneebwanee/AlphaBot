const Discord = require('discord.js');
const Utils = require('../../modules/utils.js');
const { config, lang, embeds } = Utils.variables;
const Embed = Utils.Embed;
module.exports = {
    name: 'apply',
    run: async (bot, message, args) => {
        const settings = Utils.variables.config.Applications;
        const reviewerRole = Utils.findRole(settings.ReviewerRole, message.guild);
        const parent = Utils.findChannel(settings.Channel.Category, message.guild, 'category');
        if (!reviewerRole || !parent) return message.channel.send(Embed({ preset: 'console' }));

        message.guild.channels.create(settings.Channel.Format.replace(/{username}/g, message.author.username).replace(/{id}/g, message.author.id).replace(/{tag}/g, message.author.tag), {
            type: 'text',
            parent: parent,
            permissionOverwrites: [
                {
                    id: message.author.id,
                    allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
                },
                {
                    id: reviewerRole.id,
                    allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
                },
                {
                    id: message.guild.id,
                    deny: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
                }
            ]
        }).then(async channel => {

            await Utils.variables.db.update.applications.createApplication({
                guild: message.guild.id,
                channel_id: channel.id,
                channel_name: channel.name,
                creator: message.author.id
            })

            message.channel.send(Embed({ title: lang.TicketModule.Commands.Apply.Embeds.Created.Title, description: lang.TicketModule.Commands.Apply.Embeds.Created.Description.replace(/{channel}/g, channel) }));

            channel.send(Utils.setupEmbed({
                configPath: embeds.Embeds.ApplicationCreated,
                variables: [
                    ...Utils.userVariables(message.member, "user")
                ]
            }))

            if (settings.MentionReviewerRole) channel.send('<@&' + reviewerRole.id + '>');

            const Positions = settings.Positions;
            const Position_Keys = Object.keys(Positions);

            channel.send(Utils.setupEmbed({
                configPath: embeds.Embeds.ApplicationPosition,
                variables: [
                    { searchFor: "{positions}", replaceWith: Position_Keys.join(', ') }
                ]
            }))

            async function done(positionChosen) {
                if (!positionChosen) return channel.send(Embed());
                const position = Positions[positionChosen];
                channel.setTopic(settings.Channel.Topic.replace(/{user-tag}/g, message.author.tag).replace(/{user-id}/g, message.author.id).replace(/{position}/g, positionChosen).replace(/{status}/g, "Pending"));

                const answers = [];

                for (let i = 0; i < position.Questions.length; i++) {
                    const question = position.Questions[i];
                    const text = typeof question == 'object' ? question.Question : question;
                    let m = await channel.send(Embed({ description: (typeof question == 'object' && question.Options) ? text + question.Options.map((o, i) => ((i == 0) ? "\n" : "") + "\n" + Utils.getEmoji(i + 1) + " **" + o + "**").join("") : text }));
                    async function waitForResponse() {
                        if (typeof question == 'object' && question.Options) {
                            let OptionsToEmojis = {}
                            question.Options.forEach(async (option, i) => {
                                OptionsToEmojis[`${option}`] = Utils.getEmoji(i + 1);
                                await m.react(Utils.getEmoji(i + 1));
                            })


                            await Utils.waitForReaction(Object.values(OptionsToEmojis), message.author.id, m)
                                .then(async reaction => {
                                    answers.push(Object.keys(OptionsToEmojis)[Object.values(OptionsToEmojis).indexOf(reaction.emoji.name)])
                                })
                        } else {
                            await Utils.waitForResponse(message.author.id, channel)
                                .then(async response => {

                                    let attachments = "";
                                    if (response.attachments) {
                                        attachments = response.attachments.map((attachment, i) => {
                                            return `**${attachment.name}** - [Click Here](${attachment.proxyURL})`
                                        }).join("\n")
                                    }

                                    if (typeof question == 'object' && question.RegExp) {
                                        if (!new RegExp(question.RegExp).test(response.content)) {
                                            channel.send(Embed({ title: question.FailedRegExp || lang.TicketModule.Commands.Apply.Errors.FailedRegExp, color: Utils.variables.config.EmbedColors.Error }));
                                            await waitForResponse();
                                        } else answers.push(response.content + (attachments.length ? "\n\n" + attachments : ""));
                                    } else answers.push(response.content + (attachments.length ? "\n\n" + attachments : ""));
                                });
                        }

                    }
                    await waitForResponse();
                }

                if (settings.DeleteEmbedsAndSendAnswers) channel.bulkDelete(100);

                channel.send(Utils.setupEmbed({
                    configPath: embeds.Embeds.ApplicationComplete,
                    variables: [
                        { searchFor: /{position}/g, replaceWith: positionChosen }
                    ]
                }))

                if (settings.DeleteEmbedsAndSendAnswers) {
                    let embed = Utils.Embed({ title: lang.TicketModule.Commands.Apply.Embeds.Answers.Title, fields: [{ name: lang.TicketModule.Commands.Apply.Embeds.Answers.Field, value: `${message.member} (${message.author.id})` }] });
                    answers.forEach((answer, i) => {
                        if (answer.length >= 1024) {
                            embed.embed.fields.push({ name: position.Questions.map(q => q.Question || q)[i], value: answer.substring(0, 1000) + '-' });
                            embed.embed.fields.push({ name: '\u200B', value: '-' + answer.substring(1000) });
                        } else embed.embed.fields.push({ name: position.Questions.map(q => q.Question || q)[i], value: answer });
                    })

                    const Haste = await Utils.paste(`Applicant: ${message.author.tag} (${message.author.id})\nFinished At: ${new Date().toLocaleString()}\n\nAnswers:\n\n${answers.map((ans, i) => `Question:\n${position.Questions.map(q => q.Question || q)[i]}\n\nAnswer:\n${ans}`).join('\n\n')}`, Utils.variables.config.Applications.Logs.PasteSite);
                    channel.send(embed).catch(err => {
                        channel.send(Embed({
                            title: lang.TicketModule.Commands.Apply.Embeds.Answers.Title,
                            fields: [{ name: lang.TicketModule.Commands.Apply.Embeds.Answers.Field, value: `${message.member} (${message.author.id})` }, { name: "Answers", value: "The application was too long, so it has been uploaded here:\n" + Haste }]
                        }))
                    })

                    if (Utils.variables.config.Applications.Logs.Enabled) {
                        const channel = Utils.findChannel(Utils.variables.config.Applications.Logs.Channel, message.guild);
                        if (channel) channel.send(Embed({ title: lang.TicketModule.Commands.Apply.Embeds.ApplicationLog.Title, url: Haste, description: lang.TicketModule.Commands.Apply.Embeds.ApplicationLog.Description, fields: [{ name: lang.TicketModule.Commands.Apply.Embeds.ApplicationLog.Field, value: `${message.member} (${message.author.id})` }] }))
                    }

                    await Utils.variables.db.update.applications.completeApplication(channel.id, positionChosen, JSON.stringify(answers.map((answer, i) => {
                        return {
                            question: position.Questions.map(q => q.Question || q)[i],
                            answer: answer
                        }
                    })))
                }
            }
            async function getPosition() {
                Utils.waitForResponse(message.author.id, channel)
                    .then((response) => {
                        if (!Position_Keys.map(p => p.toLowerCase()).includes(response.content.toLowerCase())) {
                            channel.send(Embed({ color: Utils.variables.config.EmbedColors.Error, title: lang.TicketModule.Commands.Apply.Errors.InvalidPosition }));
                            return getPosition();
                        }
                        done(Position_Keys.find(p => p.toLowerCase() == response.content.toLowerCase()));
                    })
            }
            getPosition();
        })
    },
    description: "Create an application",
    usage: 'apply',
    aliases: [
        'application'
    ]
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065