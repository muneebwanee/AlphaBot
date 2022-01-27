const Utils = require("../../modules/utils");
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: "connect4",
    run: async (bot, message, args) => {
        //0 = empty
        //1 = player 1 emoji
        //2 = player 2 emoji
        let board = [
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0]
        ]

        async function checkBoard() {
            let gameOver = false;
            let isTie = false;

            // Horizontal check
            board.forEach(async row => {
                row = row.join('')
                if (row.includes('1111') || row.includes('2222')) {
                    gameOver = true;
                }
            })

            // Vertical check
            for (let i = 0; i <= 6; i++) {
                let column = `${board[0][i]}${board[1][i]}${board[2][i]}${board[3][i]}${board[4][i]}${board[5][i]}`
                if (column.includes('1111') || column.includes('2222')) {
                    gameOver = true;
                }
            }

            // Diagnol check
            let diagnols = [
                `` + board[3][0] + board[2][1] + board[1][2] + board[0][3],
                `` + board[4][0] + board[3][1] + board[2][2] + board[1][3] + board[0][4],
                `` + board[5][0] + board[4][1] + board[3][2] + board[2][3] + board[1][4] + board[0][5],
                `` + board[5][1] + board[4][2] + board[3][3] + board[2][4] + board[1][5] + board[0][6],
                `` + board[5][2] + board[4][3] + board[3][4] + board[2][5] + board[1][6],
                `` + board[5][3] + board[4][4] + board[3][5] + board[2][6],
                `` + board[5][3] + board[4][2] + board[3][1] + board[2][0],
                `` + board[5][4] + board[4][3] + board[3][2] + board[2][1] + board[1][0],
                `` + board[5][5] + board[4][4] + board[3][3] + board[2][2] + board[1][1] + board[0][0],
                `` + board[5][6] + board[4][5] + board[3][4] + board[2][3] + board[1][2] + board[0][1],
                `` + board[4][6] + board[3][5] + board[2][4] + board[1][3] + board[0][2],
                `` + board[3][6] + board[3][5] + board[1][4] + board[0][3],
            ]

            await Utils.asyncForEach(diagnols, async diagnol => {
                if (diagnol.includes('1111') | diagnol.includes('2222')) {
                    gameOver = true;
                }
            })

            // Tie check
            let fullBoard = board.map(row => row.join("")).join("\n");
            if (!fullBoard.includes("0")) {
                isTie = true;
                gameOver = true;
            }

            // end
            return {
                over: gameOver,
                tie: isTie
            };
        }

        async function dropIntoColumn(column, turn) {
            return new Promise(async (resolve, reject) => {
                let foundValidPostion = false
                for (let row = 5; row >= 0; row--) {
                    if (board[row][column] == 0) {
                        board[row][column] = turn;
                        foundValidPostion = true;
                        return resolve('success');
                    }

                    if (row == 0 && !foundValidPostion) {
                        return reject('column full')
                    }
                }

            })
        }

        let user = Utils.ResolveUser(message, 0)
        if (!args[0] || !user) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }))
        if (user.id == message.author.id || user.user.bot) return message.channel.send(Embed({ preset: 'error', description: lang.FunModule.Commands.Connect4.Errors.PlayWithBotOrSelf }))

        message.channel.send(`<@${user.id}>`, Embed({
            title: lang.FunModule.Commands.Connect4.Embeds.Invite.Title,
            description: lang.FunModule.Commands.Connect4.Embeds.Invite.Description.replace(/{user}/g, `<@${message.author.id}>`)
        })).then(async m => {
            await m.react('✅')
            await m.react('❌')

            await m.awaitReactions((reaction, member) => member.id == user.id && ['✅', '❌'].includes(reaction.emoji.name), { max: 1, time: 60000, errors: ['time'] }).then(async reaction => {
                reaction = reaction.first();
                if (reaction.emoji.name == '❌') {
                    m.delete();
                    message.channel.send(`<@${message.author.id}>`, Embed({
                        title: lang.FunModule.Commands.Connect4.Embeds.InviteCanceled.Title,
                        description: lang.FunModule.Commands.Connect4.Embeds.InviteCanceled.Descriptions[0].replace(/{user}/g, `<@${user.id}>`),
                        color: config.EmbedColors.Error
                    }))
                } else {
                    m.delete();
                    let gameOver = false;
                    let players = { 1: message.member, 2: user };
                    let turn = 2;
                    let emojis = [Utils.getEmoji(1), Utils.getEmoji(2), Utils.getEmoji(3), Utils.getEmoji(4), Utils.getEmoji(5), Utils.getEmoji(6), Utils.getEmoji(7)]

                    await message.channel.send(Embed({
                        title: lang.FunModule.Commands.Connect4.Embeds.GameBoard.Title,
                        description: lang.FunModule.Commands.Connect4.Embeds.GameBoard.Description.replace(/{player-1}/g, `<@${players[1].id}>`).replace(/{player-2}/g, `<@${players[2].id}>`).replace(/{board}/g, board.map(row => row.join("")).join("\n").replace(/0/g, '⚫ ').replace(/1/g, '🔴 ').replace(/2/g, '🟡 ') + '\n' + emojis.join(" ")).replace(/{turn}/g, `<@${players[turn].id}>`)
                    })).then(async msg => {
                        let waitMessage = await message.channel.send(lang.FunModule.Commands.Connect4.WaitForReactions)
                        await Utils.asyncForEach(emojis, async emoji => {
                            await msg.react(emoji);
                        })
                        waitMessage.delete()

                        while (!gameOver) {
                            let displayBoard = board.map(row => row.join("")).join("\n")

                            msg.edit(Embed({
                                title: lang.FunModule.Commands.Connect4.Embeds.GameBoard.Title,
                                description: lang.FunModule.Commands.Connect4.Embeds.GameBoard.Description.replace(/{player-1}/g, `<@${players[1].id}>`).replace(/{player-2}/g, `<@${players[2].id}>`).replace(/{board}/g, board.map(row => row.join("")).join("\n").replace(/0/g, '⚫ ').replace(/1/g, '🔴 ').replace(/2/g, '🟡 ') + '\n' + emojis.join(" ")).replace(/{turn}/g, `<@${players[turn].id}>`)
                            }))


                            await Utils.waitForReaction(emojis, players[turn].id, msg).then(async reaction => {
                                await dropIntoColumn(emojis.indexOf(reaction.emoji.name), turn).then(async res => {
                                    let messageReaction = msg.reactions.cache.get(reaction.emoji.name);
                                    await messageReaction.users.remove(players[turn].id);

                                    let boardStatus = await checkBoard();
                                    if (boardStatus.over == true) {

                                        let P1GameData = await Utils.variables.db.get.getGameData(message.member) || {};
                                        let P2GameData = await Utils.variables.db.get.getGameData(user) || {};

                                        if (!P1GameData.connect4) P1GameData.connect4 = {
                                            wins: 0,
                                            losses: 0,
                                            ties: 0
                                        }

                                        if (!P2GameData.connect4) P2GameData.connect4 = {
                                            wins: 0,
                                            losses: 0,
                                            ties: 0
                                        }

                                        if (boardStatus.tie) {
                                            P1GameData.connect4.ties += boardStatus.tie ? 1 : 0
                                            P2GameData.connect4.ties += boardStatus.tie ? 1 : 0
                                        } else {
                                            P1GameData.connect4.wins += (turn == 1 ? 1 : 0)
                                            P1GameData.connect4.losses += (turn == 1 ? 0 : 1)
                                            P2GameData.connect4.wins += (turn == 2 ? 1 : 0)
                                            P2GameData.connect4.losses += (turn == 2 ? 0 : 1)
                                        }

                                        await Utils.variables.db.update.games.setData(message.member, JSON.stringify(P1GameData));
                                        await Utils.variables.db.update.games.setData(user, JSON.stringify(P2GameData));

                                        if (boardStatus.tie) {
                                            await msg.edit(Embed({
                                                title: lang.FunModule.Commands.Connect4.Embeds.GameBoardOver.Title,
                                                color: '#fca903',
                                                description: lang.FunModule.Commands.Connect4.Embeds.GameBoardOver.Description.replace(/{player-1}/g, `<@${players[1].id}>`).replace(/{player-2}/g, `<@${players[2].id}>`).replace(/{board}/g, board.map(row => row.join("")).join("\n").replace(/0/g, '⚫ ').replace(/1/g, '🔴 ').replace(/2/g, '🟡 ') + '\n' + emojis.join(" ")).replace(/{winner}/g, "**TIE**")
                                            }))
                                            message.channel.send(lang.FunModule.Commands.Connect4.Embeds.GameBoardOver.GameOverTie.replace(/{player-1}/g, `<@${players[turn].id}>`).replace(/{player-2}/g, `<@${players[(turn == 1 ? 2 : 1)].id}>`))
                                        } else {
                                            await msg.edit(Embed({
                                                title: lang.FunModule.Commands.Connect4.Embeds.GameBoardOver.Title,
                                                color: turn == 1 ? '#e03131' : '#ffe600',
                                                description: lang.FunModule.Commands.Connect4.Embeds.GameBoardOver.Description.replace(/{player-1}/g, `<@${players[1].id}>`).replace(/{player-2}/g, `<@${players[2].id}>`).replace(/{board}/g, board.map(row => row.join("")).join("\n").replace(/0/g, '⚫ ').replace(/1/g, '🔴 ').replace(/2/g, '🟡 ') + '\n' + emojis.join(" ")).replace(/{winner}/g, `<@${players[turn].id}>`)
                                            }))
                                            message.channel.send(lang.FunModule.Commands.Connect4.Embeds.GameBoardOver.GameOverWin.replace(/{winner}/g, `<@${players[turn].id}>`).replace(/{loser}/g, `<@${players[(turn == 1 ? 2 : 1)].id}>`))
                                        }
                                        return gameOver = true;
                                    } else {
                                        return turn = (turn == 2) ? 1 : 2;
                                    }
                                }).catch(async err => {
                                    if (err == 'column full') {
                                        let messageReaction = msg.reactions.cache.get(reaction.emoji.name);
                                        messageReaction.users.remove(players[turn].id);
                                        return message.channel.send(Embed({
                                            title: lang.FunModule.Commands.Connect4.Errors.ColumnFull
                                        })).then(m => m.delete({ timeout: 2500 }));
                                    } else {
                                        console.log(err)
                                        message.channel.send(Embed({
                                            preset: 'console'
                                        }))
                                    }
                                })
                            })

                        }
                    })
                }
            }).catch(err => {
                message.channel.send(`<@${message.author.id}> <@${user.id}>`, Embed({
                    title: lang.FunModule.Commands.Connect4.Embeds.InviteCanceled.Title,
                    description: lang.FunModule.Commands.Connect4.Embeds.InviteCanceled.Descriptions[1].replace(/{user}/g, `<@${user.id}>`),
                    color: config.EmbedColors.Error
                }))
            })
        })
    },
    description: "Connect 4 game",
    usage: "connect4 <@user>",
    aliases: [
        'c4'
    ]
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065