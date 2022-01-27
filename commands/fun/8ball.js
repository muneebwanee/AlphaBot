const Utils = require('../../modules/utils');
const Embed = Utils.Embed;
const lang = Utils.variables.lang;
module.exports = {
    name: "8ball",
    run: async (bot, message, args) => {
        if (args.length < 1) return message.channel.send(Embed({
            preset: 'invalidargs',
            usage: module.exports.usage
        }))

        let responses = lang.FunModule.Commands["8Ball"].Answers
        let x = ~~(Math.random() * responses.length)

        message.channel.send(Embed({
            title: lang.FunModule.Commands["8Ball"].Title,
            fields: [
                {
                    name: lang.FunModule.Commands["8Ball"].Fields[0],
                    value: args.join(" ")
                },
                {
                    name: lang.FunModule.Commands["8Ball"].Fields[1],
                    value: responses[x]
                }
            ]
        }))
    },
    description: "Ask the magical 8 ball a question and get an answer",
    usage: "8ball <question>",
    aliases: []
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065