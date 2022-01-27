const Utils = require('../../modules/utils');
const Embed = Utils.Embed;
const lang = Utils.variables.lang;

const { Parser } = require('expr-eval');

module.exports = {
    name: "math",
    run: async (bot, message, args) => {
        if (args.length < 1) return message.channel.send(Embed({
            preset: 'invalidargs',
            usage: module.exports.usage
        }))

        try {
            const parser = new Parser();
            const expr = parser.evaluate(args.join(" "));

            message.channel.send(Embed({
                title: lang.FunModule.Commands.Math.Title,
                fields: [
                    {
                        name: lang.FunModule.Commands.Math.Fields[0],
                        value: args.join(" ")
                    },
                    {
                        name: lang.FunModule.Commands.Math.Fields[1],
                        value: expr
                    }
                ]
            }))
        } catch (err) {
            message.channel.send(Embed({
                preset: 'error',
                description: "An error occured while evaluating the equation."
            }))
        }
    },
    description: "Evaluate a math equation",
    usage: "math <equation>",
    aliases: []
}
// 239232   8501   2161065    ION__%%   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065