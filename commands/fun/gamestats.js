const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: 'gamestats',
    run: async (bot, message, args) => {
        const user = Utils.ResolveUser(message) || message.member;
        let gameData = await Utils.variables.db.get.getGameData(user) || {};

        if (!gameData.connect4) gameData.connect4 = {
            wins: 0,
            losses: 0,
            ties: 0
        }

        if (!gameData.tictactoe) gameData.tictactoe = {
            wins: 0,
            losses: 0,
            ties: 0
        }

        message.channel.send(Embed({
            author: {
                icon: user.user.displayAvatarURL({ dynamic: true }),
                text: user.user.username
            },
            title: lang.FunModule.Commands.Gamestats.Title,
            fields: [ 
                {
                    name: lang.FunModule.Commands.Gamestats.Fields[0].name,
                    value: lang.FunModule.Commands.Gamestats.Fields[0].value.replace(/{wins}/g, gameData.connect4.wins).replace(/{losses}/g, gameData.connect4.losses).replace(/{ties}/g, gameData.connect4.ties).replace(/{total}/g, Object.values(gameData.connect4).reduce((a, b) => a + b)),                    inline: true
                }, {
                    name: lang.FunModule.Commands.Gamestats.Fields[1].name,
                    value: lang.FunModule.Commands.Gamestats.Fields[1].value.replace(/{wins}/g, gameData.tictactoe.wins).replace(/{losses}/g, gameData.tictactoe.losses).replace(/{ties}/g, gameData.tictactoe.ties).replace(/{total}/g, Object.values(gameData.tictactoe).reduce((a, b) => a + b)),
                    inline: true
                }
            ],
            timestamp: new Date()
        }))
    },
    description: "View a user's game stats",
    usage: 'gamestats [@user]',
    aliases: [
        'connect4stats', 'tictactoestats'
    ]
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065