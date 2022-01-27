const Utils = require("../modules/utils.js");
const CommandHandler = require('../modules/handlers/CommandHandler');
const CustomConfig = require('../modules/CustomConfig.js');
const ytdlDiscord = require('ytdl-core-discord');
const YoutubeAPI = require("simple-youtube-api");
const chalk = require("chalk");
const fs = require("fs");

const servers = new Map()
const Embed = Utils.Embed;
const config = new CustomConfig('./addon_configs/music.yml', {
    YouTubeAPIKey: "PUT-YOUTUBE-API-KEY-HERE",
    Lang: {
        Errors: {
            NotInVoiceChannel: 'You must be in a voice channel to run this command.',
            NotPlayingMusic: "The bot is currently not playing music.",
            CantSkip: "You can not skip because the music queue only has one song.",
            NotPaused: "The bot is already playing music.",
            AlreadyPlayingMusic: "I am already playing music in another voice channel.",
            InvalidPermissions: "I do not have the required permissions to join or speak in this voice channel.",
            NotAllInfoObtained: "Information for one of the songs requested could not be found.",
            NoSearchResults: ["No search results could be found for that search query", "Top 10 search results for `{search}` could not be found"],
            InvalidPageNumber: "That is not a valid page number!"
        },
        Embeds: {
            NowPlaying: {
                Title: "🎶 Now playing:",
                RequestBy: "Requested By",
                Length: "Song Length: {length}"
            },
            AddedToQueue: {
                Song: "📜 Added to Queue:",
                Playlist: "📜 Added Playlist to Queue:",
                PlaylistLength: "{amount} songs in playlist",
            },
            Top10: {
                Title: "Top 10 Results",
                Description: "Displaying top 10 search results for `{search}`. Select a video to add to the queue by reacting with it's corresponding emoji. \n\n{results}"
            },
            Queue: {
                Title: "Music Queue (Page #{page})",
                Description: "{queue}",
                CurrentlyPlaying: "🎶 **Currently Playing:** [{song-name}]({song-url})\n\n"
            },
            Pause: {
                Title: "⏸️ Paused song:",
                Description: "{song-name}"
            },
            Resume: {
                Title: "🎶 Resumed playing:",
                Description: "{song-name}"
            },
            Skip: {
                Title: "⏭️ Skipping song..."
            },
            StoppedMusic: {
                Title: "⏹️ Music Stopped",
                Description: "You stopped the music queue!"
            },
            QueueOver: {
                Title: "⏹️ Stopping Music",
                Description: "The music queue is now over"
            },
            Join: {
                Title: "☎️ Joined voice channel"
            },
            Leave: {
                Title: "👋 Leaving voice channel"
            }
        },
        CommandDescriptions: {
            play: "Play a song in the voice channel you are in.",
            stop: "Stop the bot from playing music.",
            queue: "View the song queue",
            skip: "Skip to a certain song in the queue",
            pause: "Pause the current song",
            resume: "Resume the current song",
            join: "Have the bot join your voice channel"
        }
    },
    RequiredRanks: {
        play: "@everyone",
        stop: "@everyone",
        queue: "@everyone",
        skip: "@everyone",
        pause: "@everyone",
        resume: "@everyone",
        join: "@everyone"
    }
})
let YT;

module.exports = async bot => {
    let musicAddonPrefix = chalk.hex("#2bbcff").bold("[MUSIC ADDON] ")
    let infoPrefix = Utils.infoPrefix
    if (fs.existsSync("./addons/ultimatemusic.js")) return console.log(infoPrefix + musicAddonPrefix + "Unloading normal music addon...")
    let errorPrefix = Utils.errorPrefix
    YT = new YoutubeAPI(config.YouTubeAPIKey);

    let Server = class Server {
        constructor(message, guild, connection) {
            this.guild = message.guild
            this.textChannel = message.channel
            this.voiceChannel = message.member.voice.channel
            this.songs = []
            this.connection = connection ? connection : null
            this.volume = 5
            this.paused = false
            this.repeat = null
        }
    }

    let Song = class Song {
        constructor(video, requestedBy) {
            this.requestedBy = requestedBy
            this.url = "https://www.youtube.com/watch?v=" + video.id
            this.title = video.title
            this.image = Object.values(video.thumbnails)[Object.values(video.thumbnails).length - 1].url
            this.author = {
                name: video.channel.title,
                link: "https://www.youtube.com/channel/" + video.channel.id
            }

        }
    }

    async function play(message, song, guild = undefined) {
        guild = !!guild ? guild : message.guild

        let server = servers.get(guild.id)

        if (!server) {
            server = new Server(message, guild)
            servers.set(guild.id, server)
            server.songs.push(song)
        }

        if (!server.connection) server.connection = await server.voiceChannel.join()

        let dispatcher;

        try {
            dispatcher = server.connection.play(await ytdlDiscord(song.url, { highWaterMark: 1 << 25, quality: "highestaudio" }), { type: 'opus' });
        } catch (e) {
            if (e.message == "Status code: 429") console.log(errorPrefix + musicAddonPrefix + " You are currently being rate limited by Google/YouTube! (Error code 429)")
            if (e.message.includes("This is a private video.")) {
                server.textChannel.send(Embed({ preset: "error", description: "This video is privated. " + (server.songs.length ? "Attempting to play the next song..." : "Ending queue.") }))
                server.songs.shift()

                if (server.songs.length) {

                    server.textChannel.send(Embed({
                        title: config.Lang.Embeds.NowPlaying.Title,
                        fields: [{ name: server.songs[0].author.name, value: server.songs[0].title, inline: true }, { name: config.Lang.Embeds.NowPlaying.RequestBy, value: message ? '<@' + message.author.id + '>' : config.Lang.AutoPlay.AutoPlay, inline: true }],
                        thumbnail: server.songs[0].image,
                        timestamp: new Date()
                    }))

                    return play(message, server.songs[0], guild)
                }
                else {
                    server.connection.dispatcher.destroy();
                    guild.me.voice.channel.leave();
                    servers.delete(guild.id)
                }
            }
            else console.log(e)

            return server.textChannel.send(Embed({ preset: "console" }))
        }

        dispatcher.setVolumeLogarithmic(server.volume / 5);

        dispatcher.on('finish', async () => {
            server.songs.shift();
            if (server.songs.length > 0) {
                play(message, server.songs[0], guild)
                return server.textChannel.send(Embed({
                    title: config.Lang.Embeds.NowPlaying.Title,
                    fields: [{ name: server.songs[0].author.name, value: server.songs[0].title, inline: true }, { name: config.Lang.Embeds.NowPlaying.RequestBy, value: '<@' + message.author.id + '>', inline: true }],
                    thumbnail: server.songs[0].image,
                    timestamp: new Date()
                }));
            } else {
                if (guild.me.voice.channel) guild.me.voice.channel.leave();
                servers.delete(server.guild.id);
                server.textChannel.send(Embed({ title: config.Lang.Embeds.QueueOver.Title, description: config.Lang.Embeds.QueueOver.Description, timestamp: new Date() }))
            }
        })

        dispatcher.on('error', error => {
            console.log(errorPrefix + musicAddonPrefix + error)
        })
    }

    function checkError(error, channel, shutdown = false) {
        if (error.errors && error.errors.some(e => e.message == "API key not valid. Please pass a valid API key." || e.reason == 'keyInvalid')) {
            console.log(errorPrefix + musicAddonPrefix + "The set Youtube API key is incorrect. " + (shutdown ? "Shutting down..." : " "))
            channel.send(Embed({ preset: 'error', description: "The set Youtube API key is incorrect. " + (shutdown ? "Shutting down..." : " ") }))
            return shutdown ? process.exit() : false;
        } else {
            console.log(error)
            return channel.send(Embed({
                preset: 'console'
            }))
        }
    }

    function checkInfo(song) {
        let missingInfo = false;
        let missingData = [];

        Object.values(song).forEach((value, i) => {
            if (typeof value == "object") {
                Object.values(value).forEach((v, index) => {
                    if (!v) {
                        missingInfo = true;
                        missingData.push(Object.keys(song)[i] + " - " + Object.keys(value)[index])
                    }
                })
            } else if (!value) {
                missingData.push(Object.keys(song)[i])
                missingInfo = true;
            }
        })

        return missingInfo
    }

    function checkPerms(message, command) {
        let perms = true;
        let requiredRank = config.RequiredRanks[command];
        if (config && requiredRank !== false) {
            let role = Utils.findRole(requiredRank, message.guild)
            if (!role) {
                message.channel.send(Embed({ preset: 'console' }));
                perms = false;
            } else if (!Utils.hasPermission(message.member, requiredRank)) {
                perms = false;
                message.channel.send(Embed({ preset: 'nopermission' }));
            }
            return perms
        } else return perms;
    }

    function getType(search) {
        if (search.includes("youtube.com") && (search.includes('/playlist') || search.includes('&list='))) return 'playlist'
        else if (search.includes("youtube.com") && search.includes('/watch')) return 'video'
        else return 'search'
    }

    async function checkCommand(message, commandName) {
        let cont = true;
        let server = servers.get(message.guild.id);

        if (checkPerms(message, commandName) == false) {
            cont = false;
        }

        else if (commandName !== "play" && (!server || (server && (!server.connection || !server.songs.length || (server.connection && !server.connection.dispatcher))))) {
            cont = false;
            message.channel.send(Embed({ preset: 'error', description: config.Lang.Errors.NotPlayingMusic }));
        }

        else if (!message.member.voice.channel) {
            cont = false;
            message.channel.send(Embed({ preset: 'error', description: config.Lang.Errors.NotInVoiceChannel }));
        }

        return cont
    }

    // PLAY
    CommandHandler.set({
        name: "play",
        run: async (bot, message, args) => {

            if (!await checkCommand(message, "play")) return;

            let server = servers.get(message.guild.id);
            if (!server) {
                server = new Server(message)
                servers.set(message.guild.id, server)
            }

            if (message.guild.me.voice.channel && message.guild.me.voice.channel.id !== message.member.voice.channel.id) return message.channel.send(Embed({ preset: 'error', description: config.Lang.Errors.AlreadyPlayingMusic }))
            if (!args.length && server.paused == true) {
                server.paused = false;
                server.connection.dispatcher.resume()
                return message.channel.send(Embed({ title: config.Lang.Embeds.Resume.Title, description: config.Lang.Embeds.Resume.Description.replace(/{song-name}/g, server.songs[0].title), thumbnail: server.songs[0].image, timestamp: new Date() }));
            }
            if (!args.length) return message.channel.send(Embed({ preset: 'invalidargs', usage: "play [song/playlist/search query]" }));

            if (!message.member.voice.channel.permissionsFor(bot.user).has('CONNECT') || !message.member.voice.channel.permissionsFor(bot.user).has('SPEAK')) return message.channel.send(Embed({ preset: 'error', description: config.Lang.Errors.InvalidPermissions }))

            let video;

            async function addSong(video, fromPlaylist = false) {
                return new Promise(async (resolve, reject) => {
                    let song = new Song(video, message.author.id)

                    let missingInfo = checkInfo(song)
                    if (missingInfo) return message.channel.send(Embed({ preset: 'error', description: config.Lang.Errors.NotAllInfoObtained[1] }))

                    if (server.songs.length < 1) {
                        server.songs.push(song);
                        try {
                            server.connection = await message.member.voice.channel.join();
                            play(message, server.songs[0]);
                            message.channel.send(Embed({
                                title: config.Lang.Embeds.NowPlaying.Title,
                                fields: [{ name: server.songs[0].author.name, value: server.songs[0].title, inline: true }, { name: config.Lang.Embeds.NowPlaying.RequestBy, value: '<@' + message.author.id + '>', inline: true }],
                                thumbnail: server.songs[0].image,
                                timestamp: new Date()
                            }));
                            resolve()
                        } catch (e) {
                            console.log(errorPrefix + musicAddonPrefix + e)
                            servers.delete(message.guild.id);
                            message.channel.send(Embed({ preset: 'console' }));
                        }
                    } else {
                        server.songs.push(song);
                        if (!fromPlaylist) message.channel.send(Embed({
                            title: config.Lang.Embeds.AddedToQueue.Song,
                            fields: [{ name: server.songs[server.songs.length - 1].author.name, value: server.songs[server.songs.length - 1].title, inline: true }, { name: config.Lang.Embeds.NowPlaying.RequestBy, value: '<@' + message.author.id + '>', inline: true }],
                            thumbnail: server.songs[server.songs.length - 1].image,
                            timestamp: new Date()
                        }));
                        resolve()
                    }
                })
            }

            async function playlist() {
                return new Promise(async (resolve, reject) => {
                    try {
                        await YT.getPlaylist(args.join(" ")).then(async playlist => {
                            let videos = await playlist.getVideos()

                            await Utils.asyncForEach(videos, async video => {
                                await addSong(video, fromPlaylist = true)
                            })

                            message.channel.send(Embed({
                                title: config.Lang.Embeds.AddedToQueue.Playlist,
                                fields: [{ name: playlist.channel.title, value: playlist.title, inline: true }, { name: config.Lang.Embeds.NowPlaying.RequestBy, value: '<@' + message.author.id + '>', inline: true }],
                                footer: config.Lang.Embeds.AddedToQueue.PlaylistLength.replace(/{amount}/g, videos.length),
                                thumbnail: playlist.thumbnails.medium.url,
                                timestamp: new Date()
                            }))
                            resolve()
                        })
                    } catch (e) {
                        reject(e)
                    }
                })
            }

            async function song() {
                return new Promise(async (resolve, reject) => {
                    try {
                        video = await YT.getVideo(args[0]);
                        await addSong(video);
                        resolve()
                    } catch (e) {
                        reject(e)
                    }
                })
            }

            async function search() {
                return new Promise(async (resolve, reject) => {
                    try {
                        let topResults = await YT.searchVideos(args.join(' '), 10);
                        if (topResults.length < 1) return message.channel.send(Embed({
                            preset: 'error',
                            description: config.Lang.Errors.NoSearchResults[0]
                        }))
                        if (topResults) {
                            message.channel.send(Embed({
                                title: config.Lang.Embeds.Top10.Title,
                                description: config.Lang.Embeds.Top10.Description.replace(/{search}/g, args.join(" ")).replace(/{results}/g, topResults.map((result, i) => {
                                    return `${Utils.getEmoji(i + 1)} - **${result.title}**: **${result.channel.title}**`
                                }).join('\n\n'))
                            })).then(async msg => {
                                let emojisToVideos = {}

                                await topResults.forEach((video, i) => emojisToVideos[Utils.getEmoji(i + 1)] = video)

                                Utils.asyncForEach(topResults, async (video, i) => {
                                    if (i == 0) await msg.react("❌").catch(e => { })
                                    await msg.react(Utils.getEmoji(i + 1)).catch(e => { })
                                })

                                await Utils.waitForReaction([...Object.keys(emojisToVideos), "❌"], message.author.id, msg).then(async reaction => {
                                    if (reaction.emoji.name == "❌") {
                                        msg.delete();
                                        message.delete();
                                        return;
                                    }

                                    let video = Object.values(emojisToVideos)[Object.keys(emojisToVideos).indexOf(reaction.emoji.name)]

                                    msg.delete();
                                    await addSong(video);
                                    resolve()
                                })
                            })
                        } else {
                            reject('no results')
                        }
                    } catch (e) {
                        reject(e)
                    }
                })
            }

            let type = getType(args.join(" "));

            if (type == 'playlist') {
                await playlist()
                    .catch(async err => {
                        await song()
                            .catch(async err => {
                                await search()
                                    .catch(async err => {
                                        if (err == 'no results') return message.channel.send(Embed({ preset: 'error', description: config.Lang.Errors.NoSearchResults[1].replace(/{search}/g, args.join(" ")) }));
                                        await checkError(err, message.channel, false)
                                    })
                            })
                    })
            }

            else if (type == 'video') {
                await song()
                    .catch(async err => {
                        await search()
                            .catch(async err => {
                                if (err == 'no results') return message.channel.send(Embed({ preset: 'error', description: config.Lang.Errors.NoSearchResults[1].replace(/{search}/g, args.join(" ")) }));
                                await checkError(err, message.channel, false)
                            })
                    })
            }

            else if (type == 'search') {
                await search()
                    .catch(async err => {
                        if (err == 'no results') return message.channel.send(Embed({ preset: 'error', description: config.Lang.Errors.NoSearchResults[1].replace(/{search}/g, args.join(" ")) }));
                        await checkError(err, message.channel, false)
                    })
            }
        },
        description: "Play a song",
        usage: "play [song/playist/search query]",
        aliases: [],
        type: "music"
    })

    // QUEUE
    CommandHandler.set({
        name: 'queue',
        run: async (bot, message, args) => {
            let server = servers.get(message.guild.id);
            if (!await checkCommand(message, "queue")) return;

            let page = +args[0] || 1;
            let pages = []

            await server.songs.forEach(async (song, i) => {
                let str = "";

                if (i == 0) {
                    str += config.Lang.Embeds.Queue.CurrentlyPlaying.replace(/{song-name}/g, song.title).replace(/{song-url}/g, song.url)
                }

                str += '[**' + (i + 1) + '**] ' + `[${song.title}](${song.url})\n`

                if (i % 15 == 0) {
                    pages.push(str)
                } else {
                    if (!pages[0]) pages[0] = str
                    else pages[pages.length - 1] += str
                }

            })

            if (pages.length < page || page < 1) return message.channel.send(Embed({ preset: "error", description: config.Lang.Errors.InvalidPageNumber }));

            message.channel.send(Embed({
                title: config.Lang.Embeds.Queue.Title.replace(/{page}/g, page),
                description: config.Lang.Embeds.Queue.Description.replace(/{queue}/g, pages[page - 1]),
                timestamp: new Date(),
                thumbnail: server.songs[0].image
            }));
        },
        description: config.Lang.CommandDescriptions.queue,
        usage: 'queue',
        aliases: ['musicqueue'],
        type: 'music'
    })

    // PAUSE
    CommandHandler.set({
        name: 'pause',
        run: async (bot, message, args) => {
            let server = servers.get(message.guild.id);
            if (!await checkCommand(message, "pause")) return;

            server.paused = true;
            server.connection.dispatcher.pause();
            message.channel.send(Embed({ color: '#fca103', title: config.Lang.Embeds.Pause.Title, description: config.Lang.Embeds.Pause.Description.replace(/{song-name}/g, server.songs[0].title), thumbnail: server.songs[0].image, timestamp: new Date() }));
        },
        description: config.Lang.CommandDescriptions.pause,
        usage: 'pause',
        aliases: [],
        type: 'music'
    })

    // RESUME
    CommandHandler.set({
        name: 'resume',
        run: async (bot, message, args) => {
            let server = servers.get(message.guild.id);
            if (!await checkCommand(message, "resume")) return;
            if (!server.paused) return message.channel.send(Embed({ preset: 'error', description: config.Lang.Errors.NotPaused }));

            server.paused = false;
            server.connection.dispatcher.resume();
            message.channel.send(Embed({ title: config.Lang.Embeds.Resume.Title, description: config.Lang.Embeds.Resume.Description.replace(/{song-name}/g, server.songs[0].title), thumbnail: server.songs[0].image, timestamp: new Date() }));
        },
        description: config.Lang.CommandDescriptions.resume,
        usage: 'resume',
        aliases: [],
        type: 'music'
    })

    // SKIP
    CommandHandler.set({
        name: 'skip',
        run: async (bot, message, args) => {
            let server = servers.get(message.guild.id);
            if (!await checkCommand(message, "skip")) return;
            if (server.songs.length == 1) return message.channel.send(Embed({ preset: 'error', description: config.Lang.Errors.CantSkip }));

            message.channel.send(Embed({ title: config.Lang.Embeds.Skip.Title }));
            server.connection.dispatcher.emit('finish');
        },
        description: config.Lang.CommandDescriptions.skip,
        usage: 'skip',
        aliases: ['next'],
        type: 'music'
    })

    // STOP
    CommandHandler.set({
        name: 'stop',
        run: async (bot, message, args, { prefixUsed, commandUsed }) => {
            let server = servers.get(message.guild.id);

            if (commandUsed == "leave" && !server) {
                if (message.member.voice.channel && message.guild.me.voice.channel && message.member.voice.channelID == message.guild.me.voice.channelID) {
                    await message.member.voice.channel.leave();
                    return message.channel.send(Embed({ title: config.Lang.Embeds.Leave.Title, timestamp: new Date() }))
                }
            }

            if (!await checkCommand(message, "stop")) return;
            if (!server.connection.dispatcher) return message.channel.send(Embed({ preset: "error" }));

            server.connection.dispatcher.destroy();
            message.member.voice.channel.leave();
            servers.delete(message.guild.id)
            message.channel.send(Embed({ title: config.Lang.Embeds.StoppedMusic.Title, description: config.Lang.Embeds.StoppedMusic.Description, timestamp: new Date() }))
        },
        description: config.Lang.CommandDescriptions.stop,
        usage: 'stop',
        aliases: [
            'stopmusic',
            'end',
            'endsong',
            'leave'
        ],
        type: 'music'
    })

    // JOIN
    CommandHandler.set({
        name: 'join',
        run: async (bot, message, args) => {
            if (!checkPerms(message, "join")) return
            else if (!message.member.voice.channel) return message.channel.send(Embed({ preset: 'error', description: config.Lang.Errors.NotInVoiceChannel }))
            else if (message.guild.me.voice.channel) return message.channel.send(Embed({ preset: "error", description: config.Lang.Errors.AlreadyPlayingMusic }))

            await message.member.voice.channel.join()
            message.channel.send(Embed({ title: config.Lang.Embeds.Join.Title, timestamp: new Date() }))
        },
        description: config.Lang.CommandDescriptions.join,
        usage: 'join',
        aliases: [],
        type: 'music'
    })

    const eventHandler = require('../modules/handlers/EventHandler');
    eventHandler.set('voiceStateUpdate', (bot, oldState, newState) => {
        if (oldState.channel && !newState.channel) {
            let server = servers.get(oldState.channel.guild.id);
            if (!server) return
            else {
                let members = oldState.channel.members;
                if (members.size == 1 && members.get(bot.user.id)) {
                    server.voiceChannel.leave()
                    server.textChannel.send(Embed({ title: config.Lang.Embeds.QueueOver.Title, description: config.Lang.Embeds.QueueOver.Description, timestamp: new Date() }))
                    servers.delete(oldState.channel.guild.id)
                }
            }
        }
    })

    console.log(infoPrefix + musicAddonPrefix + "Addon loaded - Corebot is ready to begin playing music!")
}