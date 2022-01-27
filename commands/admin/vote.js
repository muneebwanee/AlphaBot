const Utils = require("../../modules/utils.js");
const { Discord } = require("../../modules/utils.js");
const { lang, config, embeds } = Utils.variables;
const Embed = Utils.Embed;

module.exports = {
  name: 'vote',
  run: async (bot, message, args) => {
        let questions = [
            lang.AdminModule.Commands.Vote.Embeds.PollSetup.Questions[0],
            lang.AdminModule.Commands.Vote.Embeds.PollSetup.Questions[1],
            lang.AdminModule.Commands.Vote.Embeds.PollSetup.Questions[2],
            lang.AdminModule.Commands.Vote.Embeds.PollSetup.Questions[3],
            lang.AdminModule.Commands.Vote.Embeds.PollSetup.Questions[4],
            lang.AdminModule.Commands.Vote.Embeds.PollSetup.Questions[5]
        ]
        let answers = [];
        let pollEmojis;
        let msgIDs = [];

        const askQuestion = async (i, ask = true) => {
            const question = questions[i];
            if (ask) await message.channel.send(Embed({ title: lang.AdminModule.Commands.Vote.Embeds.PollSetup.Title.replace(/{pos}/g, (i + 1) + '/6'), description: question })).then(msg => msgIDs.push(msg.id));

            await Utils.waitForResponse(message.author.id, message.channel)
                .then(response => {
                    msgIDs.push(response.id);
                    if (response.content.toLowerCase() === "cancel") return message.channel.send(Embed({ preset: "error", description: lang.AdminModule.Commands.Vote.SetupCanceled }))
                    else if (i == 5) {
                        if (response.mentions.channels.first()) {
                            answers.push(response.mentions.channels.first())
                        } else {
                            if (response.content == "here") answers.push(message.channel);
                            else if (response.content == "default") {
                                let channel = Utils.findChannel(config.Channels.DefaultPolls, message.guild);

                                if (!channel) {
                                    message.channel.send(Embed({ color: config.EmbedColors.Error, title: lang.AdminModule.Commands.Update.Embeds.InvalidChannel.Title, description: lang.AdminModule.Commands.Update.Embeds.InvalidChannel.Description })).then(msg => msg.delete({ timeout: 2500 }));
                                    return askQuestion(i, false);
                                } else answers.push(channel)
                            } else {
                                message.channel.send(Embed({ color: config.EmbedColors.Error, title: lang.AdminModule.Commands.Update.Embeds.InvalidChannel.Title, description: lang.AdminModule.Commands.Update.Embeds.InvalidChannel.Description })).then(msg => msg.delete({ timeout: 2500 }));
                                return askQuestion(i, false);
                            }
                        }
                    } else if (i == 2 && response.content.toLowerCase() !== 'no') {
                        pollEmojis = response.content.replace(/\s+/g, '').split(',');
                        return askQuestion(i + 2)
                    } else {
                        answers.push(response.content)
                    }

                    if (answers[3] && answers[3] > 10 && !pollEmojis) {
                        answers.pop()
                        message.channel.send(Embed({ preset: 'error', description: lang.AdminModule.Commands.Vote.Errors.MaxChoices }));
                        return askQuestion(i, false)
                    }

                    if (i >= questions.length - 1) finishUpdate();
                    else askQuestion(++i);
                })
        }

        askQuestion(0)

        const finishUpdate = () => {
            if (pollEmojis) {
                answers[3].send(Utils.setupEmbed({
                    configPath: embeds.Embeds.Poll,
                    thumbnail: answers[2].includes("http") ? answers[2] : undefined,
                    variables: [
                        ...Utils.userVariables(message.member, "user"),
                        { searchFor: /{question}/g, replaceWith: answers[0] },
                        { searchFor: /{description}/g, replaceWith: answers[1] }
                    ]
                })).then(async msg => {
                    pollEmojis.forEach(async emoji => {
                        let start = emoji.lastIndexOf(":")
                        if ((new RegExp(/:[0-9]{18}>/g)).test(emoji)) emoji = emoji.substring(start + 1, start + 19)

                        await msg.react(emoji).catch(error => {
                            if (error.code && error.code == 10014) message.channel.send(Embed({ preset: 'error', description: lang.AdminModule.Commands.Vote.Errors.CouldNotReact.replace(/{emoji}/g, emoji) }))
                            else {
                                message.channel.send(Embed({ preset: 'console' }))
                                console.log(error);
                            }
                        })
                    })
                });
            } else {
                answers[5].send(Utils.setupEmbed({
                    configPath: embeds.Embeds.Poll,
                    thumbnail: answers[4].includes("http") ? answers[4] : undefined,
                    variables: [
                        ...Utils.userVariables(message.member, "user"),
                        { searchFor: /{question}/g, replaceWith: answers[0] },
                        { searchFor: /{description}/g, replaceWith: answers[1] }
                    ]
                })).then(async msg => {
                    if (!pollEmojis) for (i = 0; i < answers[3]; i++) {
                        await msg.react(Utils.getEmoji(i + 1));
                    }
                });
            }

            msgIDs.forEach(async id => (await message.channel.messages.fetch(id)).delete());
            message.channel.send(Embed({ title: lang.AdminModule.Commands.Vote.Embeds.Posted.Title, description: lang.AdminModule.Commands.Vote.Embeds.Posted.Description, color: config.EmbedColors.Success }))
        }
  },
  description: "Create a poll",
  usage: 'vote',
  aliases: ['poll']
}
// 239232   __%%   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065