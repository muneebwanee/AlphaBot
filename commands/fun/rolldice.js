const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const Discord = Utils.Discord;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: 'rolldice',
    run: async (bot, message, args) => {
        let diceSides = {
            1: lang.FunModule.Commands.Rolldice.Sides[0],
            2: lang.FunModule.Commands.Rolldice.Sides[1],
            3: lang.FunModule.Commands.Rolldice.Sides[2],
            4: lang.FunModule.Commands.Rolldice.Sides[3],
            5: lang.FunModule.Commands.Rolldice.Sides[4],
            6: lang.FunModule.Commands.Rolldice.Sides[5]
        };
        let dice = Object.keys(diceSides)[Math.floor(Math.random() * Object.keys(diceSides).length)];

        await message.channel.send(lang.FunModule.Commands.Rolldice.RollingDice);
        await message.channel.send(Embed({
            title: lang.FunModule.Commands.Rolldice.Embed.Title,
            description: lang.FunModule.Commands.Rolldice.Embed.Description.replace(/{result}/g, dice),
            thumbnail: Object.values(diceSides)[Object.keys(diceSides).indexOf(dice)],
            footer: { text: lang.FunModule.Commands.Rolldice.Embed.Footer.replace(/{user}/g, message.author.tag), icon: message.author.displayAvatarURL({ dynamic: true }) }
        }))
    },
    description: "Roll a dice",
    usage: 'rolldice',
    aliases: [
        'roll',
        'dice'
    ]
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065