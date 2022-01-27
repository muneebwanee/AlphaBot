const Utils = require("../../modules/utils");
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: "tictactoe",
    run: async (bot, message, args) => {
        let spacing = " "
        //number emoji = empty
        //1 = x
        //2 = o
        let board = [
            [Utils.getEmoji(1) + spacing, Utils.getEmoji(2) + spacing, Utils.getEmoji(3) + spacing],
            [Utils.getEmoji(4) + spacing, Utils.getEmoji(5) + spacing, Utils.getEmoji(6) + spacing],
            [Utils.getEmoji(7) + spacing, Utils.getEmoji(8) + spacing, Utils.getEmoji(9) + spacing],
        ]
        let emojis = [[Utils.getEmoji(1), Utils.getEmoji(2), Utils.getEmoji(3)], [Utils.getEmoji(4), Utils.getEmoji(5), Utils.getEmoji(6)], [Utils.getEmoji(7), Utils.getEmoji(8), Utils.getEmoji(9)]]
        let flattenedEmojis = Array.prototype.concat.apply([], emojis)

        async function checkBoard() {
            let gameOver = false;
            let isTie = false;

            // Horizontal check
            board.forEach(async row => {
                row = row.join('').replace(/\s+/g, '')
                if (row.includes('222') || row.includes('111')) {
                    gameOver = true;
                }
            })

            // Vertical check
            for (let i = 0; i <= 2; i++) {
                let column = `${board[0][i]}${board[1][i]}${board[2][i]}`.replace(/\s+/g, '')
                if (column.includes('111') || column.includes('222')) {
                    gameOver = true;
                }
            }

            // Diagnol check
            let diagnols = [
                `` + board[0][0] + board[1][1] + board[2][2],
                `` + board[0][2] + board[1][1] + board[2][0]
            ]

            await Utils.asyncForEach(diagnols, async diagnol => {
                diagnol = diagnol.replace(/\s+/g, '')
                if (diagnol.includes('111') | diagnol.includes('222')) {
                    gameOver = true;
                }
            })

            // Tie check
            let fullBoard = board.map(row => row.join("")).join("\n");
            if (!gameOver) {
                if (flattenedEmojis.every(emoji => !fullBoard.includes(emoji))) {
                    isTie = true;
                    gameOver = true;
                }
            }

            return {
                over: gameOver,
                tie: isTie
            };
        }

        async function addIntoSlot(slot, turn) {
            return new Promise(async (resolve, reject) => {
                let row;
                if ([0, 1, 2].includes(slot)) row = 0;
                if ([3, 4, 5].includes(slot)) row = 1;
                if ([6, 7, 8].includes(slot)) row = 2;
                slot = slot - (row * 3);

                if (!['❌', '⭕'].includes(board[row][slot])) {
                    board[row][slot] = turn + spacing;
                    return resolve('success');
                } else reject('column full')
            })
        }

        let user = Utils.ResolveUser(message, 0)
        if (!args[0] || !user) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }))
        if (user.id == message.author.id || user.user.bot) return message.channel.send(Embed({ preset: 'error', description: lang.FunModule.Commands.TicTacToe.Errors.PlayWithBotOrSelf }))

        message.channel.send(`<@${user.id}>`, Embed({
            title: lang.FunModule.Commands.TicTacToe.Embeds.Invite.Title,
            description: lang.FunModule.Commands.TicTacToe.Embeds.Invite.Description.replace(/{user}/g, `<@${message.author.id}>`)
        })).then(async m => {
            await m.react('✅')
            await m.react('❌')

            await m.awaitReactions((reaction, member) => member.id == user.id && ['✅', '❌'].includes(reaction.emoji.name), { max: 1, time: 60000, errors: ['time'] }).then(async reaction => {
                reaction = reaction.first();
                if (reaction.emoji.name == '❌') {
                    m.delete();
                    message.channel.send(`<@${message.author.id}>`, Embed({
                        title: lang.FunModule.Commands.TicTacToe.Embeds.InviteCanceled.Title,
                        description: lang.FunModule.Commands.TicTacToe.Embeds.InviteCanceled.Descriptions[0].replace(/{user}/g, `<@${user.id}>`),
                        color: config.EmbedColors.Error
                    }))
                } else {
                    m.delete();
                    let gameOver = false;
                    let players = { 1: message.member, 2: user };
                    let turn = 2;

                    await message.channel.send(Embed({
                        title: lang.FunModule.Commands.TicTacToe.Embeds.GameBoard.Title,
                        description: lang.FunModule.Commands.TicTacToe.Embeds.GameBoard.Description.replace(/{player-1}/g, `<@${players[1].id}>`).replace(/{player-2}/g, `<@${players[2].id}>`).replace(/{board}/g, board.map((row, i) => row.join("")).join("\n").replace(/1 /g, '❌' + spacing).replace(/2 /g, '⭕' + spacing)).replace(/{turn}/g, `${turn == 1 ? "❌" : "⭕"} <@${players[turn].id}>`)
                    })).then(async msg => {
                        let waitMessage = await message.channel.send(lang.FunModule.Commands.TicTacToe.WaitForReactions)
                        await Utils.asyncForEach(flattenedEmojis, async emoji => {
                            await msg.react(emoji);
                        })
                        waitMessage.delete()

                        while (!gameOver) {
                            msg.edit(Embed({
                                title: lang.FunModule.Commands.TicTacToe.Embeds.GameBoard.Title,
                                description: lang.FunModule.Commands.TicTacToe.Embeds.GameBoard.Description.replace(/{player-1}/g, `<@${players[1].id}>`).replace(/{player-2}/g, `<@${players[2].id}>`).replace(/{board}/g, board.map((row, i) => row.join("")).join("\n").replace(/1 /g, '❌' + spacing).replace(/2 /g, '⭕' + spacing)).replace(/{turn}/g, `${turn == 1 ? "❌" : "⭕"} <@${players[turn].id}>`)
                            }))


                            await Utils.waitForReaction(flattenedEmojis, players[turn].id, msg).then(async reaction => {
                                await addIntoSlot(flattenedEmojis.indexOf(reaction.emoji.name), turn).then(async res => {
                                    let messageReaction = msg.reactions.cache.get(reaction.emoji.name);
                                    await messageReaction.remove()

                                    let boardStatus = await checkBoard();
                                    if (boardStatus.over == true) {

                                        let P1GameData = await Utils.variables.db.get.getGameData(message.member) || {};
                                        let P2GameData = await Utils.variables.db.get.getGameData(user) || {};

                                        if (!P1GameData.tictactoe) P1GameData.tictactoe = {
                                            wins: 0,
                                            losses: 0,
                                            ties: 0
                                        }

                                        if (!P2GameData.tictactoe) P2GameData.tictactoe = {
                                            wins: 0,
                                            losses: 0,
                                            ties: 0
                                        }

                                        if (boardStatus.tie) {
                                            P1GameData.tictactoe.ties += boardStatus.tie ? 1 : 0
                                            P2GameData.tictactoe.ties += boardStatus.tie ? 1 : 0
                                        } else {
                                            P1GameData.tictactoe.wins += ((turn == 1) ? 1 : 0)
                                            P1GameData.tictactoe.losses += ((turn == 1) ? 0 : 1)
                                            P2GameData.tictactoe.wins += ((turn == 2) ? 1 : 0)
                                            P2GameData.tictactoe.losses += ((turn == 2) ? 0 : 1)
                                        }

                                        await Utils.variables.db.update.games.setData(message.member, JSON.stringify(P1GameData));
                                        await Utils.variables.db.update.games.setData(user, JSON.stringify(P2GameData));

                                        if (boardStatus.tie) {
                                            await msg.edit(Embed({
                                                title: lang.FunModule.Commands.TicTacToe.Embeds.GameBoardOver.Title,
                                                color: '#fca903',
                                                description: lang.FunModule.Commands.TicTacToe.Embeds.GameBoardOver.Description.replace(/{player-1}/g, `<@${players[1].id}>`).replace(/{player-2}/g, `<@${players[2].id}>`).replace(/{board}/g, board.map((row, i) => row.join("")).join("\n").replace(/1 /g, '❌' + spacing).replace(/2 /g, '⭕' + spacing)).replace(/{winner}/g, lang.FunModule.Commands.TicTacToe.Embeds.GameBoardOver.Tie)
                                            }))
                                            message.channel.send(lang.FunModule.Commands.TicTacToe.Embeds.GameBoardOver.GameOverTie.replace(/{player-1}/g, `<@${players[turn].id}>`).replace(/{player-2}/g, `<@${players[(turn == 1 ? 2 : 1)].id}>`))
                                        } else {
                                            await msg.edit(Embed({
                                                title: lang.FunModule.Commands.TicTacToe.Embeds.GameBoardOver.Title,
                                                color: turn == 1 ? '#e03131' : '#ffe600',
                                                description: lang.FunModule.Commands.TicTacToe.Embeds.GameBoardOver.Description.replace(/{player-1}/g, `<@${players[1].id}>`).replace(/{player-2}/g, `<@${players[2].id}>`).replace(/{board}/g, board.map((row, i) => row.join("")).join("\n").replace(/1 /g, '❌' + spacing).replace(/2 /g, '⭕' + spacing)).replace(/{winner}/g, `${turn == 1 ? "❌" : "⭕"} <@${players[turn].id}>`)
                                            }))
                                            message.channel.send(lang.FunModule.Commands.TicTacToe.Embeds.GameBoardOver.GameOverWin.replace(/{winner}/g, `<@${players[turn].id}>`).replace(/{loser}/g, `<@${players[(turn == 1 ? 2 : 1)].id}>`))
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
                                            title: lang.FunModule.Commands.TicTacToe.Errors.ColumnFull
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
                    title: lang.FunModule.Commands.TicTacToe.Embeds.InviteCanceled.Title,
                    description: lang.FunModule.Commands.TicTacToe.Embeds.InviteCanceled.Descriptions[1].replace(/{user}/g, `<@${user.id}>`),
                    color: config.EmbedColors.Error
                }))
            })
        })
    },
    description: "Tic-Tac-Toe game",
    usage: "tictactoe <@user>",
    aliases: [
        'tic-tac-toe',
        'ttt'
    ]
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065