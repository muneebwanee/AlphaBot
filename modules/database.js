let Utils = {};
const yml = require('./yml.js');
const fs = require('fs');

module.exports = {
    mysql: {

    },
    sqlite: {

    },
    setup: async (config) => {
        return new Promise(async (resolve, reject) => {
            Utils = require('./utils.js');
            const type = config.Storage.Type;
            if (!['sqlite', 'mysql'].includes(type.toLowerCase())) return reject('Invalid database type.');
            if (type.toLowerCase() == 'mysql') {
                try {
                    require.resolve('mysql');

                    await new Promise(async resolve => {
                        module.exports.mysql.module = require('mysql');
                        const db = module.exports.mysql.module.createConnection({
                            host: config.Storage.MySQL.Host,
                            user: config.Storage.MySQL.User,
                            password: config.Storage.MySQL.Password,
                            database: config.Storage.MySQL.Database
                        });

                        db.connect(async (err) => {
                            if (err) {
                                if (err.message.startsWith('getaddrinfo ENOTFOUND') || err.message.startsWith("connect ECONNREFUSED")) {
                                    console.log(err.message);
                                    console.log(Utils.errorPrefix + 'The provided MySQL Host address is incorrect. Be sure to not include the port!' + Utils.color.Reset)
                                    return process.exit();
                                } else {
                                    return console.log(err);
                                }
                            }

                            const calls = [
                                `USE ${config.Storage.MySQL.Database}`,
                                'CREATE TABLE IF NOT EXISTS coins (user VARCHAR(18) NOT NULL, guild VARCHAR(18) NOT NULL, coins INT NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS experience (user VARCHAR(18) NOT NULL, guild VARCHAR(18) NOT NULL, level INT NOT NULL, xp INT NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS filter (word TEXT NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS giveaways (messageID VARCHAR(18) NOT NULL, name TEXT, end BIGINT(20) NOT NULL, winners INT NOT NULL, channel VARCHAR(18) NOT NULL, guild VARCHAR(18) NOT NULL, ended BOOLEAN NOT NULL, start BIGINT(20) NOT NULL, users TEXT, creator VARCHAR(18) NOT NULL, description TEXT)',
                                'CREATE TABLE IF NOT EXISTS giveawayreactions (giveaway VARCHAR(18) NOT NULL, user VARCHAR(18) NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS prefixes (guild VARCHAR(18) NOT NULL, prefix TEXT NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS status (type TEXT NOT NULL, activity TEXT NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS tickets (guild VARCHAR(18) NOT NULL, channel_id VARCHAR(18) NOT NULL, channel_name TEXT NOT NULL, creator VARCHAR(18) NOT NULL, reason TEXT NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS ticketsaddedusers (user VARCHAR(18) NOT NULL, ticket VARCHAR(18) NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS ticketmessages (message VARCHAR(18), author VARCHAR(18) NOT NULL, authorAvatar TEXT NOT NULL, authorTag TEXT NOT NULL, created_at BIGINT(20) NOT NULL, embed_title TEXT, embed_description TEXT, embed_color TEXT, attachment TEXT, content TEXT, ticket VARCHAR(18) NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS ticketmessages_embed_fields (message VARCHAR(18), name TEXT NOT NULL, value TEXT NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS modules (name TEXT NOT NULL, enabled BOOLEAN NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS punishments (id INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT, type TEXT NOT NULL, user VARCHAR(18) NOT NULL, tag TEXT NOT NULL, reason TEXT NOT NULL, time BIGINT(20) NOT NULL, executor VARCHAR(18) NOT NULL, length INTEGER)',
                                'CREATE TABLE IF NOT EXISTS warnings (id INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT, user VARCHAR(18) NOT NULL, tag TEXT NOT NULL, reason TEXT NOT NULL, time BIGINT(20) NOT NULL, executor VARCHAR(18) NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS jobs (user VARCHAR(18), guild VARCHAR(18), job TEXT, tier INTEGER, amount_of_times_worked INTEGER)',
                                'CREATE TABLE IF NOT EXISTS job_cooldowns (user VARCHAR(18), guild VARCHAR(18), date BIGINT(20))',
                                'CREATE TABLE IF NOT EXISTS dailycoinscooldown (user VARCHAR(18), guild VARCHAR(18), date BIGINT(20))',
                                'CREATE TABLE IF NOT EXISTS commands (name TEXT NOT NULL, enabled BOOLEAN NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS applications (guild VARCHAR(18), channel_id VARCHAR(18), channel_name TEXT NOT NULL, creator VARCHAR(18), status TEXT NOT NULL, rank TEXT NOT NULL, questions_answers TEXT NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS applicationmessages (message VARCHAR(18), author VARCHAR(18) NOT NULL, authorAvatar TEXT NOT NULL, authorTag TEXT NOT NULL, created_at BIGINT(20) NOT NULL, embed_title TEXT, embed_description TEXT, embed_color TEXT, attachment TEXT, content TEXT, application VARCHAR(18) NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS applicationmessages_embed_fields (message VARCHAR(18), name TEXT NOT NULL, value TEXT NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS saved_roles (user VARCHAR(18), guild VARCHAR(18), roles TEXT)',
                                'CREATE TABLE IF NOT EXISTS game_data (user VARCHAR(18), guild VARCHAR(18), data TEXT)'
                            ]

                            await Promise.all(
                                calls.map(call => {
                                    return new Promise(resolve => {
                                        db.query(call, err => {
                                            if (err) reject(err);
                                            resolve();
                                        });
                                    })
                                })
                            )
                            console.log(Utils.infoPrefix + 'MySQL connected.');

                            module.exports.mysql.database = db;

                            // Set default bot status
                            db.query('SELECT * FROM status', (err, status) => {
                                if (err) throw err;
                                if (status.length < 1) {
                                    db.query('INSERT INTO status VALUES(?, ?)', ['Playing', 'CoreBot']);
                                }
                            })

                            setTimeout(() => {
                                // Set default modules
                                db.query('SELECT * FROM modules', (err, modules) => {
                                    if (err) throw err;
                                    const Commands = require('./handlers/CommandHandler');
                                    const moduleNames = [...new Set(Commands.commands.map(c => c.type))];
                                    moduleNames.forEach(m => {
                                        if (!modules.map(mod => mod.name).includes(m)) {
                                            db.query('INSERT INTO modules(name, enabled) VALUES(?, ?)', [m, true], (err) => {
                                                if (err) console.log(err);
                                            })
                                        }
                                    })
                                })

                                // Set default commands
                                db.query('SELECT * FROM commands', (err, commands) => {
                                    if (err) throw err;

                                    const Commands = require('./handlers/CommandHandler');
                                    const commandNames = [...new Set(Commands.commands.map(c => c.command))];
                                    commandNames.forEach(c => {
                                        if (!commands.map(cmd => cmd.name).includes(c)) {
                                            db.query('INSERT INTO commands(name, enabled) VALUES(?, ?)', [c, true], (err) => {
                                                if (err) console.log(err);
                                            })
                                        }
                                    })
                                })
                            }, 2000)

                            resolve();
                        })
                    })
                } catch (err) {
                    reject(Utils.errorPrefix + 'MySQL is not installed or the database info is incorrect. Install mysql with npm install mysql. Database will default to sqlite.');
                    type = 'sqlite';
                }
            }
            if (type.toLowerCase() == 'sqlite') {
                try {
                    require.resolve('better-sqlite3');

                    await new Promise(async resolve => {
                        module.exports.sqlite.module = require('better-sqlite3');
                        const db = module.exports.sqlite.module('database.sqlite');

                        module.exports.sqlite.database = db;

                        const calls = [
                            'CREATE TABLE IF NOT EXISTS coins(user text, guild text, coins integer)',
                            'CREATE TABLE IF NOT EXISTS experience(user text, guild text, level integer, xp integer)',
                            'CREATE TABLE IF NOT EXISTS experience(user text, guild text, level integer, xp integer)',
                            'CREATE TABLE IF NOT EXISTS giveaways(messageID text, name text, end integer, winners integer, channel text, guild text, ended integer, start integer, users text, creator text, description text)',
                            'CREATE TABLE IF NOT EXISTS giveawayreactions(giveaway text, user text)',
                            'CREATE TABLE IF NOT EXISTS filter (word text)',
                            'CREATE TABLE IF NOT EXISTS prefixes(guild text PRIMARY KEY, prefix text)',
                            'CREATE TABLE IF NOT EXISTS status(type text, activity text)',
                            'CREATE TABLE IF NOT EXISTS tickets(guild text, channel_id text, channel_name text, creator text, reason text)',
                            'CREATE TABLE IF NOT EXISTS ticketsaddedusers(user text, ticket text)',
                            'CREATE TABLE IF NOT EXISTS ticketmessages (message text, author text, authorAvatar text, authorTag text, created_at integer, embed_title text, embed_description text, embed_color text, attachment text, content text, ticket text)',
                            'CREATE TABLE IF NOT EXISTS ticketmessages_embed_fields (message text, name text, value text)',
                            'CREATE TABLE IF NOT EXISTS modules(name text, enabled integer)',
                            'CREATE TABLE IF NOT EXISTS punishments(id INTEGER PRIMARY KEY AUTOINCREMENT, type text, user text, tag text, reason text, time integer, executor text, length integer)',
                            'CREATE TABLE IF NOT EXISTS warnings (id INTEGER PRIMARY KEY AUTOINCREMENT, user text, tag text, reason text, time integer, executor text)',
                            'CREATE TABLE IF NOT EXISTS jobs (user text, guild text, job text, tier integer, amount_of_times_worked integer)',
                            'CREATE TABLE IF NOT EXISTS job_cooldowns (user text, guild text, date text)',
                            'CREATE TABLE IF NOT EXISTS dailycoinscooldown (user text, guild text, date text)',
                            'CREATE TABLE IF NOT EXISTS commands(name text, enabled integer)',
                            'CREATE TABLE IF NOT EXISTS applications (guild text, channel_id text, channel_name text, creator text, status text, rank text, questions_answers text)',
                            'CREATE TABLE IF NOT EXISTS applicationmessages (message text, author text, authorAvatar text, authorTag text, created_at integer, embed_title text, embed_description text, embed_color text, attachment text, content text, application text)',
                            'CREATE TABLE IF NOT EXISTS applicationmessages_embed_fields (message text, name text, value text)',
                            'CREATE TABLE IF NOT EXISTS saved_roles (user text, guild text, roles text)',
                            'CREATE TABLE IF NOT EXISTS game_data (user text, guild text, data text)'
                        ];

                        await Promise.all(
                            calls.map(call => {
                                return new Promise(resolve => {
                                    db.prepare(call).run();
                                    resolve();
                                })
                            })
                        )

                        console.log(Utils.infoPrefix + 'Better-SQLite3 ready.');

                        // Set default bot status
                        const status = db.prepare("SELECT * FROM status").all();

                        if (status.length < 1) {
                            db.prepare("INSERT INTO status VALUES(?, ?)").run('Playing', 'CoreBot')
                        }

                        setTimeout(() => {
                            const Commands = require('./handlers/CommandHandler');

                            // Set default modules
                            const modules = db.prepare("SELECT * FROM modules").all();
                            const moduleNames = [...new Set(Commands.commands.map(c => c.type))];

                            moduleNames.forEach(m => {
                                if (!modules.map(mod => mod.name).includes(m)) db.prepare("INSERT INTO modules(name, enabled) VALUES(?, ?)").run(m, 1);
                            })

                            // Set default commands
                            const commands = db.prepare("SELECT * FROM commands").all();
                            const commandNames = [...new Set(Commands.commands.map(c => c.command))];

                            commandNames.forEach(c => {
                                if (!commands.map(cmd => cmd.name).includes(c)) db.prepare("INSERT INTO commands(name, enabled) VALUES(?, ?)").run(c, 1);
                            })
                        }, 2000)

                        resolve();
                    })
                } catch (err) {
                    console.log(err);
                    reject(Utils.errorPrefix + 'Better-SQLite3 is not installed. Install it with npm install better-sqlite3. Bot will shut down.');
                    console.log(Utils.errorPrefix + 'Better-SQLite3 is not installed. Install it with npm install better-sqlite3. Bot will shut down.');
                    process.exit();
                }
            }

            console.log(Utils.infoPrefix + 'Setup database. Type: ' + type);
            module.exports.type = type.toLowerCase();

            resolve(module.exports);

            setTimeout(() => {
                require('./handlers/KeyHandler.js').init().catch(err => { });
            }, 10000)
        })
    },
    get: {
        ticket_messages: {
            getMessages(ticket) {
                return new Promise((resolve, reject) => {
                    if (!ticket) reject('[DATABASE (get.ticket_messages.getMessages)] Invalid ticket');

                    if (module.exports.type === 'sqlite') {
                        resolve(module.exports.sqlite.database.prepare("SELECT * FROM ticketmessages WHERE ticket=?").all(ticket));
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM ticketmessages WHERE ticket=?', [ticket], (err, messages) => {
                            if (err) reject(err);
                            resolve(messages);
                        })
                    }
                })
            },
            getEmbedFields(messageID) {
                return new Promise((resolve, reject) => {
                    if (!messageID) reject('[DATABASE (get.ticket_messages.getEmbedFields)] Invalid messageID');

                    if (module.exports.type === 'sqlite') {
                        resolve(module.exports.sqlite.database.prepare("SELECT * FROM ticketmessages_embed_fields WHERE message=?").all(messageID));
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM ticketmessages_embed_fields WHERE message=?', [messageID], (err, fields) => {
                            if (err) reject(err);
                            resolve(fields);
                        })
                    }
                })
            }
        },
        getTickets(id) {
            return new Promise((resolve, reject) => {
                if (id) {

                    // SQLITE
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare("SELECT * FROM tickets WHERE channel_id=?").get(id));

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM tickets WHERE channel_id=?', [id], (err, tickets) => {
                        if (err) reject(err);
                        resolve(tickets[0])
                    })
                } else {

                    // SQLITE
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare("SELECT * FROM tickets").all());

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM tickets', (err, tickets) => {
                        if (err) reject(err);
                        resolve(tickets);
                    })
                }
            })
        },
        getAddedUsers(ticket) {
            return new Promise((resolve, reject) => {
                if (ticket) {
                    // SQLITE
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare("SELECT * FROM ticketsaddedusers WHERE ticket=?").all(ticket));

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM ticketsaddedusers WHERE ticket=?', [ticket], (err, addedusers) => {
                        if (err) reject(err);
                        resolve(addedusers)
                    })
                } else {

                    // SQLITE
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare("SELECT * FROM ticketsaddedusers").all());

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM ticketsaddedusers', (err, addedusers) => {
                        if (err) reject(err);
                        resolve(addedusers);
                    })
                }
            })
        },
        getStatus() {
            return new Promise((resolve, reject) => {
                // SQLITE
                if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare("SELECT * FROM status").get());

                // MYSQL
                if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM status', (err, status) => {
                    if (err) reject(err);
                    resolve(status[0]);
                })
            })
        },
        getCoins(user) {
            return new Promise((resolve, reject) => {
                if (user) {
                    if (!user.guild) reject('User is not a member.');

                    // SQLITE
                    if (module.exports.type === 'sqlite') {
                        const coins = module.exports.sqlite.database.prepare('SELECT * FROM coins WHERE user=? AND guild=?').get(user.id, user.guild.id);

                        if (!coins) {
                            module.exports.update.coins.updateCoins(user, 0)
                            resolve(0);
                        } else resolve(coins.coins)
                    }

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM coins WHERE user=? AND guild=?', [user.id, user.guild.id], (err, coins) => {
                        if (err) reject(err);
                        if (coins.length < 1) {
                            module.exports.update.coins.updateCoins(user, 0)
                            resolve(0);
                        }
                        else resolve(coins[0].coins);
                    })
                } else {

                    // SQLITE
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare("SELECT * FROM coins").all());

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM coins', (err, coins) => {
                        if (err) reject(err);
                        resolve(coins);
                    })
                }
            })
        },
        getExperience(user) {
            return new Promise((resolve, reject) => {
                if (user) {
                    if (!user.guild) reject('User is not a member.');

                    // SQLITE
                    if (module.exports.type === 'sqlite') {
                        const experience = module.exports.sqlite.database.prepare("SELECT * FROM experience WHERE user=? AND guild=?").get(user.id, user.guild.id);

                        if (!experience) {
                            module.exports.update.experience.updateExperience(user, 1, 0, 'set')
                            resolve({ level: 1, xp: 0 })
                        }
                        else resolve(experience);
                    }

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM experience WHERE user=? AND guild=?', [user.id, user.guild.id], (err, experience) => {
                        if (err) reject(err);
                        if (experience.length < 1) {
                            //module.exports.update.experience.updateExperience(user, 1, 0, 'set')
                            resolve({ level: 1, xp: 0 });
                        }
                        else resolve(experience[0]);
                    })
                } else {

                    // SQLITE
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare("SELECT * FROM experience").all());

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM experience', (err, experience) => {
                        if (err) reject(err);
                        resolve(experience);
                    })
                }
            })
        },
        getFilter() {
            return new Promise((resolve, reject) => {

                // SQLITE
                if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare("SELECT * FROM filter").all().map(w => w.word));

                // MYSQL
                if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM filter', (err, words) => {
                    if (err) reject(err);
                    resolve(words.map(w => w.word))
                })
            })
        },
        getGiveaways(messageID) {
            return new Promise((resolve, reject) => {
                if (messageID) {
                    // SQLITE
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare("SELECT * FROM giveaways WHERE messageID=?").get(messageID));

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM giveaways WHERE messageID=?', [messageID], (err, giveaways) => {
                        if (err) reject(err);
                        resolve(giveaways[0])
                    })
                } else {

                    // SQLITE
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare("SELECT * FROM giveaways").all());

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM giveaways', (err, giveaways) => {
                        if (err) reject(err);
                        resolve(giveaways);
                    })
                }
            })
        },
        getGiveawayFromName(name) {
            return new Promise((resolve, reject) => {
                if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare("SELECT * FROM giveaways WHERE name=? LIMIT 1").get(name));

                if (module.exports.type === 'mysql') {
                    module.exports.mysql.database.query('SELECT * FROM giveaways WHERE name=? LIMIT 1', [name], (err, giveaways) => {
                        if (err) reject(err);
                        return resolve(giveaways[0]);
                    })
                }
            })
        },
        getGiveawayFromID(id) {
            return new Promise((resolve, reject) => {
                if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare("SELECT * FROM giveaways WHERE messageID=?").get(id));
                if (module.exports.type === 'mysql') {
                    module.exports.mysql.database.query('SELECT * FROM giveaways WHERE messageID=? LIMIT 1', [id], (err, giveaways) => {
                        if (err) reject(err);
                        return resolve(giveaways[0]);
                    })
                }
            })
        },
        getLatestGiveaway() {
            return new Promise((resolve, reject) => {
                if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare("SELECT * FROM giveaways ORDER BY start DESC LIMIT 1").get());
                if (module.exports.type === 'mysql') {
                    module.exports.mysql.database.query('SELECT * FROM giveaways ORDER BY start DESC LIMIT 1', (err, giveaways) => {
                        if (err) reject(err);
                        return resolve(giveaways[0]);
                    })
                }
            })
        },
        getGiveawayReactions(id) {
            return new Promise((resolve, reject) => {
                if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare("SELECT * FROM giveawayreactions WHERE giveaway=?").all(id).map(r => r.user));
                if (module.exports.type === 'mysql') {
                    module.exports.mysql.database.query('SELECT * FROM giveawayreactions WHERE giveaway=?', [id], (err, reactions) => {
                        if (err) reject(err);
                        return resolve(reactions.map(r => r.user));
                    })
                }
            })
        },
        getGiveawayWinners(id) {
            return new Promise((resolve, reject) => {
                if (module.exports.type === 'sqlite') resolve(JSON.parse(module.exports.sqlite.database.prepare("SELECT users FROM giveaways WHERE messageID=?").get(id).users))
                if (module.exports.type === 'mysql') {
                    module.exports.mysql.database.query('SELECT users FROM giveaways WHERE messageID=?', [id], (err, giveaways) => {
                        if (err) reject(err);
                        return resolve(JSON.parse(giveaways[0].users));
                    })
                }
            })
        },
        getPrefixes(guildID) {
            return new Promise((resolve, reject) => {
                if (guildID) {

                    // SQLITE
                    if (module.exports.type === 'sqlite') {
                        let prefix = module.exports.sqlite.database.prepare('SELECT * FROM prefixes WHERE guild=?').get(guildID);

                        if (!prefix) {
                            resolve(Utils.variables.config.Prefix)
                            return module.exports.update.prefixes.updatePrefix(guildID, Utils.variables.config.Prefix);
                        }

                        resolve(prefix.prefix)
                    }

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM prefixes WHERE guild=?', [guildID], (err, prefixes) => {
                        if (err) reject(err);
                        if (prefixes.length < 1) {
                            resolve(Utils.variables.config.Prefix)
                            return module.exports.update.prefixes.updatePrefix(guildID, Utils.variables.config.Prefix);
                        }
                        resolve(prefixes[0].prefix)
                    })
                } else {

                    // SQLITE
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM prefixes').all());

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM prefixes', (err, prefixes) => {
                        if (err) reject(err);
                        resolve(prefixes);
                    })
                }
            })
        },
        getPunishments(id) {
            return new Promise((resolve, reject) => {
                if (id) {
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM punishments WHERE id=?').get(id));
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM punishments WHERE id=?', [id], (err, rows) => {
                            if (err) reject(err);
                            else resolve(rows[0]);
                        })
                    }
                } else {
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM punishments').all());
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM punishments', (err, rows) => {
                            if (err) reject(err);
                            else resolve(rows);
                        })
                    }
                }
            })
        },
        getPunishmentsForUser(user) {
            return new Promise((resolve, reject) => {
                if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM punishments WHERE user=?').all(user));
                if (module.exports.type === 'mysql') {
                    module.exports.mysql.database.query('SELECT * FROM punishments WHERE user=?', [user], (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    })
                }
            })
        },
        getPunishmentID() {
            return new Promise((resolve, reject) => {
                if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT id FROM punishments ORDER BY id DESC LIMIT 1').get().id)
                if (module.exports.type === 'mysql') {
                    module.exports.mysql.database.query('SELECT id FROM punishments ORDER BY id DESC LIMIT 1', (err, punishments) => {
                        if (err) return reject(err);
                        resolve(punishments[0].id);
                    })
                }
            })
        },
        getWarnings(user) {
            return new Promise((resolve, reject) => {
                if (user && user.id) {
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM warnings WHERE user=?').all(user.id));
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM warnings WHERE user=?', [user.id], (err, warnings) => {
                            if (err) reject(err);
                            else resolve(warnings);
                        })
                    }
                } else {
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM warnings').all());
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM warnings', (err, warnings) => {
                            if (err) reject(err);
                            else resolve(warnings);
                        })
                    }
                }
            })
        },
        getWarning(id) {
            return new Promise((resolve, reject) => {
                if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM warnings WHERE id=?').get(id));
                if (module.exports.type === 'mysql') {
                    module.exports.mysql.database.query('SELECT * FROM warnings WHERE id=?', [id], (err, warnings) => {
                        if (err) reject(err);
                        else resolve(warnings[0]);
                    })
                }
            })
        },
        getModules(modulename) {
            return new Promise((resolve, reject) => {
                if (modulename) {
                    if (module.exports.type === 'sqlite') {
                        const Module = module.exports.sqlite.database.prepare('SELECT * FROM modules WHERE name=?').get(modulename);
                        if (Module) {
                            resolve({ name: Module.name, enabled: !!Module.enabled });
                        } else {
                            resolve({ name: modulename, enabled: true });
                        }
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM modules WHERE name=?', [modulename], (err, rows) => {
                            if (err) reject(err);
                            else resolve(rows[0]);
                        })
                    }
                } else {
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM modules').all().map(m => {
                        return {
                            name: m.name,
                            enabled: !!m.enabled
                        }
                    }))
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM modules', (err, rows) => {
                            if (err) reject(err);
                            resolve(rows);
                        })
                    }
                }
            })
        },
        getJobs(user) {
            return new Promise((resolve, reject) => {
                if (user) {
                    if (!user.guild) reject('User is not a member.');

                    if (module.exports.type === 'sqlite') {
                        const job = module.exports.sqlite.database.prepare('SELECT * FROM jobs WHERE user=? AND guild=?').get(user.id, user.guild.id);
                        if (!job) resolve();
                        else resolve({
                            user: job.user,
                            guild: job.guild,
                            job: job.job,
                            tier: job.tier,
                            nextWorkTime: job.next_work_time,
                            amountOfTimesWorked: job.amount_of_times_worked
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM jobs WHERE user=? AND guild=?', [user.id, user.guild.id], (err, rows) => {
                            if (err) reject(err);
                            if (rows.length < 1) resolve(undefined)
                            else resolve({
                                user: rows[0].user,
                                guild: rows[0].guild,
                                job: rows[0].job,
                                tier: rows[0].tier,
                                nextWorkTime: rows[0].next_work_time,
                                amountOfTimesWorked: rows[0].amount_of_times_worked
                            });
                        })
                    }
                } else {
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM jobs').all().map(j => {
                        return {
                            user: j.user,
                            guild: j.guild,
                            job: j.job,
                            tier: j.tier,
                            nextWorkTime: j.next_work_time,
                            amountOfTimesWorked: j.amount_of_times_worked
                        }
                    }))
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM jobs', (err, rows) => {
                            if (err) reject(err);
                            rows = rows.map(r => {
                                return {
                                    user: r.user,
                                    guild: r.guild,
                                    job: r.job,
                                    tier: r.tier,
                                    nextWorkTime: r.next_work_time,
                                    amountOfTimesWorked: r.amount_of_times_worked
                                }
                            })
                            resolve(rows);
                        })
                    }
                }
            })
        },
        getWorkCooldowns(user) {
            return new Promise((resolve, reject) => {
                if (user) {
                    if (!user.guild) reject('User is not a member.');

                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM job_cooldowns WHERE user=? AND guild=?').get(user.id, user.guild.id));
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM job_cooldowns WHERE user=? AND guild=?', [user.id, user.guild.id], (err, cooldowns) => {
                            if (err) reject(err);
                            if (cooldowns.length < 1) resolve(undefined)
                            else resolve(cooldowns[0]);
                        })
                    }
                } else {
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM job_cooldowns').all());
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM job_cooldowns', (err, rows) => {
                            if (err) reject(err);
                            resolve(rows);
                        })
                    }
                }
            })
        },
        getDailyCoinsCooldown(user) {
            return new Promise((resolve, reject) => {
                if (user) {
                    if (!user.guild) reject('User is not a member.');

                    if (module.exports.type === 'sqlite') {
                        const cooldown = module.exports.sqlite.database.prepare('SELECT * FROM dailycoinscooldown WHERE user=? AND guild=?').get(user.id, user.guild.id);
                        resolve(cooldown ? cooldown.date : undefined);
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM dailycoinscooldown WHERE user=? AND guild=?', [user.id, user.guild.id], (err, rows) => {
                            if (err) reject(err);
                            if (rows.length < 1) resolve(undefined)
                            else resolve(rows[0].date);
                        })
                    }
                } else reject('User required');
            })
        },
        getCommands(commandname) {
            return new Promise((resolve, reject) => {
                if (commandname) {
                    if (module.exports.type === 'sqlite') {
                        const command = module.exports.sqlite.database.prepare('SELECT * FROM commands WHERE name=?').get(commandname);
                        if (!command) resolve();
                        else resolve({ name: command.name, enabled: !!command.enabled });
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM commands WHERE name=?', [commandname], (err, rows) => {
                            if (err) reject(err);
                            else resolve(rows[0]);
                        })
                    }
                } else {
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM commands').all().map(c => {
                        return {
                            name: c.name,
                            enabled: !!c.enabled
                        }
                    }))
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM commands', (err, rows) => {
                            if (err) reject(err);
                            resolve(rows);
                        })
                    }
                }
            })
        },
        getApplications(id) {
            return new Promise((resolve, reject) => {
                if (id) {

                    // SQLITE
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM applications WHERE channel_id=?').get(id));

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM applications WHERE channel_id=?', [id], (err, applications) => {
                        if (err) reject(err);
                        resolve(applications[0])
                    })
                } else {

                    // SQLITE
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM applications').all());

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM applications', (err, applications) => {
                        if (err) reject(err);
                        resolve(applications);
                    })
                }
            })
        },
        application_messages: {
            getMessages(application) {
                return new Promise((resolve, reject) => {
                    if (!application) reject('Invalid application');

                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM applicationmessages WHERE application=?').all(application))
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM applicationmessages WHERE application=?', [application], (err, messages) => {
                            if (err) reject(err);
                            resolve(messages);
                        })
                    }
                })
            },
            getEmbedFields(messageID) {
                return new Promise((resolve, reject) => {
                    if (!messageID) reject('Invalid messageID');

                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM applicationmessages_embed_fields WHERE message=?').all(messageID));
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM applicationmessages_embed_fields WHERE message=?', [messageID], (err, fields) => {
                            if (err) reject(err);
                            resolve(fields);
                        })
                    }
                })
            }
        },
        getSavedRoles(user) {
            return new Promise((resolve, reject) => {
                if (user && user.id && user.guild) {
                    if (module.exports.type === 'sqlite') {
                        let roles = module.exports.sqlite.database.prepare('SELECT * FROM saved_roles WHERE user=? AND guild=?').get(user.id, user.guild.id)
                        resolve(roles ? JSON.parse(roles.roles) : undefined)
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM saved_roles WHERE user=? AND guild=?', [user.id, user.guild.id], (err, roles) => {
                            if (err) reject(err);
                            else resolve(roles.length ? JSON.parse(roles[0].roles) : undefined);
                        })
                    }
                } else {
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM saved_roles').all());
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM saved_roles', (err, roles) => {
                            if (err) reject(err);
                            else resolve(roles);
                        })
                    }
                }
            })
        },
        getGameData(user) {
            return new Promise((resolve, reject) => {
                if (user && user.id && user.guild) {
                    if (module.exports.type === 'sqlite') {
                        const data = module.exports.sqlite.database.prepare('SELECT * FROM game_data WHERE user=? AND guild=?').get(user.id, user.guild.id);
                        if (!data) resolve();
                        else resolve(JSON.parse(data.data));
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM game_data WHERE user=? AND guild=?', [user.id, user.guild.id], (err, data) => {
                            if (err) reject(err);

                            if (!data.length) resolve(undefined)
                            else resolve(JSON.parse(data[0].data));
                        })
                    }
                } else {
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM game_data').all());
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM game_data', (err, data) => {
                            if (err) reject(err);
                            else resolve(data);
                        })
                    }
                }
            })
        }
    },
    update: {
        prefixes: {
            async updatePrefix(guild, newprefix) {
                return new Promise(async (resolve, reject) => {
                    if ([guild, newprefix].some(t => !t)) reject('Invalid parameters');

                    if (module.exports.type === 'sqlite') {
                        const prefixes = module.exports.sqlite.database.prepare('SELECT * FROM prefixes WHERE guild=?').all(guild);
                        if (prefixes.length > 0) {
                            module.exports.sqlite.database.prepare('UPDATE prefixes SET prefix=? WHERE guild=?').run(newprefix, guild);
                            resolve();
                        } else {
                            module.exports.sqlite.database.prepare('INSERT INTO prefixes(guild, prefix) VALUES(?, ?)').run(guild, newprefix);
                            resolve();
                        }
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM prefixes WHERE guild=?', [guild], (err, prefixes) => {
                            if (err) reject(err);
                            if (prefixes.length > 0) {
                                module.exports.mysql.database.query('UPDATE prefixes SET prefix=? WHERE guild=?', [newprefix, guild], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                })
                            } else {
                                module.exports.mysql.database.query('INSERT INTO prefixes(guild, prefix) VALUES(?, ?)', [guild, newprefix], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                })
                            }
                        })
                    }
                })
            }
        },
        tickets: {
            addedUsers: {
                remove(ticket, userid) {
                    if (!userid) return console.log('[Database.js#addedUsers#remove] Invalid inputs');
                    return new Promise((resolve, reject) => {
                        if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('DELETE FROM ticketsaddedusers WHERE ticket=? AND user=?').run(ticket, userid));
                        if (module.exports.type === 'mysql') {
                            module.exports.mysql.database.query('DELETE FROM ticketsaddedusers WHERE ticket=? AND user=?', [ticket, userid], (err) => {
                                if (err) reject(err);
                                resolve();
                            })
                        }
                    })
                },
                add(ticket, userid) {
                    if (Object.values(arguments).some(a => !a)) return console.log('[Database.js#addedUsers#add] Invalid inputs');
                    return new Promise((resolve, reject) => {
                        if (module.exports.type === 'sqlite') {
                            module.exports.sqlite.database.prepare('INSERT INTO ticketsaddedusers(user, ticket) VALUES(?, ?)').run(userid, ticket);
                            resolve();
                        }
                        if (module.exports.type === 'mysql') {
                            module.exports.mysql.database.query('INSERT INTO ticketsaddedusers(user, ticket) VALUES(?, ?)', [userid, ticket], (err) => {
                                if (err) reject(err);
                                resolve();
                            })
                        }
                    })
                }
            },
            createTicket(data) {
                if (Object.values(arguments).some(a => !a)) return console.log('[Database.js#createTicket] Invalid inputs');
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('INSERT INTO tickets(guild, channel_id, channel_name, creator, reason) VALUES(?, ?, ?, ?, ?)').run(data.guild, data.channel_id, data.channel_name, data.creator, data.reason);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('INSERT INTO tickets(guild, channel_id, channel_name, creator, reason) VALUES(?, ?, ?, ?, ?)', [data.guild, data.channel_id, data.channel_name, data.creator, data.reason], (err) => {
                            if (err) reject(err);
                            resolve();
                        })
                    }
                })
            },
            removeTicket(id) {
                if (Object.values(arguments).some(a => !a)) return console.log('[Database.js#removeTicket] Invalid inputs');
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('DELETE FROM tickets WHERE channel_id=?').run(id);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('DELETE FROM tickets WHERE channel_id=?', [id], (err) => {
                            if (err) reject(err);
                            resolve();
                        })
                    }
                })
            },
        },
        status: {
            setStatus(type, activity) {
                return new Promise((resolve, reject) => {
                    const bot = Utils.variables.bot;
                    if (activity) {
                        bot.user.setActivity(Utils.getStatusPlaceholders(activity), { type: type.toUpperCase() });
                    } else bot.user.setActivity()
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('UPDATE status SET type=?, activity=?').run(type, activity);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('UPDATE status SET type=?, activity=?', [type, activity], (err) => {
                            if (err) reject(err);
                            resolve();
                        })
                    }
                })
            }
        },
        coins: {
            updateCoins(user, amt, action) {
                return new Promise(async (resolve, reject) => {
                    if ([user, user.guild].some(t => !t)) reject('Invalid parameters in updateCoins');
                    if (module.exports.type === 'sqlite') {
                        const coins = module.exports.sqlite.database.prepare('SELECT * FROM coins WHERE user=? AND guild=?').get(user.id, user.guild.id);
                        let newcoins;
                        if (coins) {
                            if (action == 'add') newcoins = coins.coins + amt;
                            if (action == 'remove') newcoins = coins.coins - amt;
                            if (action == 'set') newcoins = amt;
                            if (newcoins < 0) newcoins = 0;

                            module.exports.sqlite.database.prepare('UPDATE coins SET coins=? WHERE user=? AND guild=?').run(newcoins, user.id, user.guild.id);
                            resolve();
                        } else {
                            if (['add', 'set'].includes(action)) newcoins = amt;
                            if (action == 'remove') newcoins = 0;
                            if (newcoins < 0) newcoins = 0;

                            module.exports.sqlite.database.prepare('INSERT INTO coins(user, guild, coins) VALUES(?, ?, ?)').run(user.id, user.guild.id, newcoins);
                            resolve();
                        }
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM coins WHERE user=? AND guild=?', [user.id, user.guild.id], (err, coins) => {
                            if (err) reject(err);
                            let newcoins;
                            if (coins.length > 0) {
                                if (action == 'add') newcoins = coins[0].coins + amt;
                                if (action == 'remove') newcoins = coins[0].coins - amt;
                                if (action == 'set') newcoins = amt;
                                if (newcoins < 0) newcoins = 0;

                                module.exports.mysql.database.query('UPDATE coins SET coins=? WHERE user=? AND guild=?', [newcoins, user.id, user.guild.id], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                })
                            } else {
                                if (['add', 'set'].includes(action)) newcoins = amt;
                                if (action == 'remove') newcoins = 0;
                                if (newcoins < 0) newcoins = 0;

                                module.exports.mysql.database.query('INSERT INTO coins(user, guild, coins) VALUES(?, ?, ?)', [user.id, user.guild.id, newcoins], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                })
                            }
                        })
                    }
                })
            },
            setJob(user, job, tier) {
                return new Promise(async (resolve, reject) => {
                    //if ([user, user.guild, job, tier].some(t => !t)) reject('Invalid parameters in setUserJob');

                    if (module.exports.type === 'sqlite') {
                        const jobFound = module.exports.sqlite.database.prepare('SELECT * FROM jobs WHERE user=? AND guild=?').get(user.id, user.guild.id);
                        if (!jobFound) {
                            module.exports.sqlite.database.prepare('INSERT INTO jobs(user, guild, job, tier, amount_of_times_worked) VALUES(?, ?, ?, ?, ?)').run(user.id, user.guild.id, job, tier, 0);
                            resolve();
                        } else {
                            module.exports.sqlite.database.prepare('UPDATE jobs SET tier=? WHERE user=? AND guild=?').run(tier, user.id, user.guild.id);
                            resolve();
                        }
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM jobs WHERE user=? AND guild=?', [user.id, user.guild.id], (err, rows) => {
                            if (err) reject(err);
                            if (!rows[0]) {
                                module.exports.mysql.database.query('INSERT INTO jobs(user, guild, job, tier, amount_of_times_worked) VALUES(?, ?, ?, ?, ?)', [user.id, user.guild.id, job, tier, 0], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                })
                            } else {
                                module.exports.mysql.database.query('UPDATE jobs SET tier=? WHERE user=? AND guild=?', [tier, user.id, user.guild.id], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                })
                            }
                        })
                    }
                })
            },
            setWorkCooldown(user, date) {
                return new Promise(async (resolve, reject) => {
                    if ([user, user.guild, date].some(t => !t)) reject('Invalid parameters in setWorkCooldown');

                    if (module.exports.type === 'sqlite') {
                        const cooldown = module.exports.sqlite.database.prepare('SELECT * FROM job_cooldowns WHERE user=? AND guild=?').get(user.id, user.guild.id);
                        if (!cooldown) {
                            module.exports.sqlite.database.prepare('INSERT INTO job_cooldowns(user, guild, date) VALUES(?, ?, ?)').run(user.id, user.guild.id, date)
                            resolve();
                        } else {
                            module.exports.sqlite.database.prepare('UPDATE job_cooldowns SET date=? WHERE user=? AND guild=?').run(date, user.id, user.guild.id);
                            resolve();
                        }
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM job_cooldowns WHERE user=? AND guild=?', [user.id, user.guild.id], (err, cooldown) => {
                            if (err) reject(err);
                            if (!cooldown.length) {
                                module.exports.mysql.database.query('INSERT INTO job_cooldowns(user, guild, date) VALUES(?, ?, ?)', [user.id, user.guild.id, date], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                })
                            } else {
                                module.exports.mysql.database.query('UPDATE job_cooldowns SET date=? WHERE user=? AND guild=?', [date, user.id, user.guild.id], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                })
                            }

                        })
                    }
                })
            },
            setWorkAmount(user, times) {
                return new Promise(async (resolve, reject) => {
                    if ([user, user.guild, times].some(t => !t)) reject('Invalid parameters in setWorkAmount');

                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('UPDATE jobs SET amount_of_times_worked=? WHERE user=? AND guild=?').run(times, user.id, user.guild.id);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('UPDATE jobs SET amount_of_times_worked=? WHERE user=? AND guild=?', [times, user.id, user.guild.id], (err) => {
                            if (err) reject(err);
                            resolve();
                        })
                    }
                })
            },
            quitJob(user) {
                return new Promise(async (resolve, reject) => {
                    if ([user, user.guild].some(t => !t)) reject('Invalid parameters in quitJob');

                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('DELETE FROM jobs WHERE user=? AND guild=?').run(user.id, user.guild.id);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM jobs WHERE user=? AND guild=?', [user.id, user.guild.id], (err, rows) => {
                            if (err) reject(err);
                            module.exports.mysql.database.query('DELETE FROM jobs WHERE user=? AND guild=?', [user.id, user.guild.id], (err) => {
                                if (err) reject(err);
                                resolve();
                            })
                        })
                    }
                })
            },
            setDailyCooldown(user, date) {
                return new Promise(async (resolve, reject) => {
                    if ([user, user.guild, date].some(t => !t)) reject('Invalid parameters in setDailyCooldown');

                    if (module.exports.type === 'sqlite') {
                        const cooldown = module.exports.sqlite.database.prepare('SELECT * FROM dailycoinscooldown WHERE user=? AND guild=?').get(user.id, user.guild.id);
                        if (cooldown) {
                            module.exports.sqlite.database.prepare('UPDATE dailycoinscooldown SET date=? WHERE user=? AND guild=?').run(date, user.id, user.guild.id);
                            resolve();
                        } else {
                            module.exports.sqlite.database.prepare('INSERT INTO dailycoinscooldown(user, guild, date) VALUES(?,?,?)').run(user.id, user.guild.id, date);
                            resolve();
                        }
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM dailycoinscooldown WHERE user=? AND guild=?', [user.id, user.guild.id], (err, rows) => {
                            if (err) reject(err);
                            if (rows.length > 0) {
                                module.exports.mysql.database.query('UPDATE dailycoinscooldown SET date=? WHERE user=? AND guild=?', [date, user.id, user.guild.id], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                })
                            } else {
                                module.exports.mysql.database.query('INSERT INTO dailycoinscooldown(user, guild, date) VALUES(?,?,?)', [user.id, user.guild.id, date], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                })
                            }
                        })
                    }
                })
            },
        },
        experience: {
            updateExperience(user, level, xp, action) {
                return new Promise(async (resolve, reject) => {
                    if ([user, user.guild].some(t => !t) || isNaN(level) || isNaN(xp)) reject('Invalid parameters in updateExperience');

                    if (module.exports.type === 'sqlite') {
                        const experience = module.exports.sqlite.database.prepare('SELECT * FROM experience WHERE user=? AND guild=?').get(user.id, user.guild.id);
                        let newxp;
                        if (experience) {
                            if (action == 'add') newxp = experience.xp + xp;
                            if (action == 'remove') newxp = experience.xp - xp;
                            if (action == 'set') newxp = xp;
                            if (newxp < 0) newxp = 0;
                            if (level < 1) level = 1;

                            module.exports.sqlite.database.prepare('UPDATE experience SET level=?, xp=? WHERE user=? AND guild=?').run(level, newxp, user.id, user.guild.id);
                            resolve();
                        } else {
                            if (['add', 'set'].includes(action)) newxp = xp;
                            if (action == 'remove') newxp = 0;
                            if (newxp < 0) newxp = 0;
                            if (level < 1) level = 1;

                            module.exports.sqlite.database.prepare('INSERT INTO experience(user, guild, level, xp) VALUES(?, ?, ?, ?)').run(user.id, user.guild.id, level, newxp);
                            resolve();
                        }
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM experience WHERE user=? AND guild=?', [user.id, user.guild.id], (err, experience) => {
                            if (err) reject(err);
                            let newxp;
                            if (experience.length > 0) {
                                if (action == 'add') newxp = experience[0].xp + xp;
                                if (action == 'remove') newxp = experience[0].xp - xp;
                                if (action == 'set') newxp = xp;
                                if (newxp < 0) newxp = 0;
                                if (level < 1) level = 1;

                                module.exports.mysql.database.query('UPDATE experience SET level=?, xp=? WHERE user=? AND guild=?', [level, newxp, user.id, user.guild.id], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                })
                            } else {
                                if (['add', 'set'].includes(action)) newxp = xp;
                                if (action == 'remove') newxp = 0 - xp;
                                if (newxp < 0) newxp = 0;
                                if (level < 1) level = 1;

                                module.exports.mysql.database.query('INSERT INTO experience(user, guild, level, xp) VALUES(?, ?, ?, ?)', [user.id, user.guild.id, level, newxp], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                })
                            }
                        })
                    }
                })
            }
        },
        filter: {
            addWord(word) {
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('INSERT INTO filter(word) VALUES(?)').run(word);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('INSERT INTO filter(word) VALUES(?)', [word], (err) => {
                            if (err) reject(err);
                            resolve();
                        })
                    }
                })
            },
            removeWord(word) {
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('DELETE FROM filter WHERE word=?').run(word);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('DELETE FROM filter WHERE word=?', [word], (err) => {
                            if (err) reject(err);
                            resolve();
                        })
                    }
                })
            }
        },
        giveaways: {
            addGiveaway(data) {
                return new Promise((resolve, reject) => {
                    if (['messageID', 'name', 'channel', 'guild', 'winners', 'end', 'creator', 'description'].some(d => !data[d]) || isNaN(data.end) || isNaN(data.winners) || data.ended !== false) return reject('Invalid data.');

                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('INSERT INTO giveaways(messageID, name, end, winners, channel, guild, ended, start, users, creator, description) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(data.messageID, data.name, data.end, data.winners, data.channel, data.guild, 0, Date.now(), '[]', data.creator, data.description);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('INSERT INTO giveaways(messageID, name, end, winners, channel, guild, ended, start, users, creator, description) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [data.messageID, data.name, data.end, data.winners, data.channel, data.guild, false, Date.now(), '[]', data.creator, data.description], (err) => {
                            if (err) console.log(err);
                            resolve();
                        })
                    }
                })
            },
            deleteGiveaway(id) {
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('DELETE FROM giveaways WHERE messageID=?').run(id);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('DELETE FROM giveaways WHERE messageID=?', [id], (err) => {
                            if (err) reject(err);
                            else resolve();
                        })
                    }
                })
            },
            setToEnded(id) {
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('UPDATE giveaways SET ended=? WHERE messageID=?').run(1, id);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('UPDATE giveaways SET ended=? WHERE messageID=?', [true, id], (err) => {
                            if (err) reject(err);
                            else resolve();
                        })
                    }
                })
            },
            setWinners(winners, id) {
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('UPDATE giveaways SET users=? WHERE messageID=?').run(winners, id);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('UPDATE giveaways SET users=? WHERE messageID=?', [winners, id], (err) => {
                            if (err) reject(err);
                            else resolve();
                        })
                    }
                })
            },
            reactions: {
                addReaction(giveaway, user) {
                    return new Promise((resolve, reject) => {
                        if (!giveaway || !user) return reject('Invalid giveaway or user.');

                        if (module.exports.type === 'sqlite') {
                            module.exports.sqlite.database.prepare('INSERT INTO giveawayreactions(giveaway, user) VALUES(?, ?)').run(giveaway, user);
                            resolve();
                        }
                        if (module.exports.type === 'mysql') {
                            module.exports.mysql.database.query('INSERT INTO giveawayreactions(giveaway, user) VALUES(?, ?)', [giveaway, user], (err) => {
                                if (err) reject(err);
                                resolve();
                            })
                        }
                    })
                },
                removeReaction(giveaway, user) {
                    return new Promise((resolve, reject) => {
                        if (!giveaway || !user) return reject('Invalid giveaway or user.');

                        if (module.exports.type === 'sqlite') {
                            module.exports.sqlite.database.prepare('DELETE FROM giveawayreactions WHERE giveaway=? AND user=?').run(giveaway, user);
                            resolve();
                        }
                        if (module.exports.type === 'mysql') {
                            module.exports.mysql.database.query('DELETE FROM giveawayreactions WHERE giveaway=? AND user=?', [giveaway, user], (err) => {
                                if (err) reject(err);
                                resolve();
                            })
                        }
                    })
                }
            }
        },
        punishments: {
            addPunishment(data) {
                return new Promise((resolve, reject) => {
                    if (['type', 'user', 'tag', 'reason', 'time', 'executor'].some(a => !data[a])) return reject('Invalid arguments for addPunishment');

                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('INSERT INTO punishments(type, user, tag, reason, time, executor, length) VALUES(?, ?, ?, ?, ?, ?, ?)').run(data.type, data.user, data.tag, data.reason, data.time, data.executor, data.length);
                        resolve()
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('INSERT INTO punishments(type, user, tag, reason, time, executor, length) VALUES(?, ?, ?, ?, ?, ?, ?)', [data.type, data.user, data.tag, data.reason, data.time, data.executor, data.length], (err) => {
                            if (err) reject(err);
                            else resolve();
                        })
                    }
                })
            },
            removePunishment(id) {
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('DELETE FROM punishments WHERE id=?').run(id);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('DELETE FROM punishments WHERE id=?', [id], (err) => {
                            if (err) reject(err);
                            else resolve();
                        })
                    }
                })
            },
            addWarning(data) {
                return new Promise((resolve, reject) => {
                    if (['user', 'tag', 'reason', 'time', 'executor'].some(a => !data[a])) return reject('Invalid arguments for addWarning');

                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('INSERT INTO warnings(user, tag, reason, time, executor) VALUES(?, ?, ?, ?, ?)').run(data.user, data.tag, data.reason, data.time, data.executor);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('INSERT INTO warnings(user, tag, reason, time, executor) VALUES(?, ?, ?, ?, ?)', [data.user, data.tag, data.reason, data.time, data.executor], (err) => {
                            if (err) reject(err);
                            else resolve();
                        })
                    }
                })
            },
            removeWarning(id) {
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('DELETE FROM warnings WHERE id=?').run(id);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('DELETE FROM warnings WHERE id=?', [id], (err) => {
                            if (err) reject(err);
                            else resolve(err);
                        })
                    }
                })
            }
        },
        modules: {
            setModule(modulename, enabled) {
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('UPDATE modules SET enabled=? WHERE name=?').run(enabled ? 1 : 0, modulename);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('UPDATE modules SET enabled=? WHERE name=?', [enabled, modulename], (err) => {
                            if (err) reject(err);
                            else resolve();
                        })
                    }
                })
            }
        },
        commands: {
            setCommand(commandname, enabled) {
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('UPDATE commands SET enabled=? WHERE name=?').run(enabled ? 1 : 0, commandname);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('UPDATE commands SET enabled=? WHERE name=?', [enabled, commandname], (err) => {
                            if (err) reject(err);
                            else resolve();
                        })
                    }
                })
            }
        },
        applications: {
            createApplication(data) {
                if (Object.values(data).some(a => !a)) return console.log('[DATABASE (update.applications.createApplication] Invalid inputs');
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('INSERT INTO applications(guild, channel_id, channel_name, creator, status) VALUES(?, ?, ?, ?, ?)').run(data.guild, data.channel_id, data.channel_name, data.creator, "Pending");
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('INSERT INTO applications(guild, channel_id, channel_name, creator, status, rank, questions_answers) VALUES(?, ?, ?, ?, ?, ?, ?)', [data.guild, data.channel_id, data.channel_name, data.creator, "Pending", " ", " "], (err) => {
                            if (err) reject(err);
                            resolve();
                        })
                    }
                })
            },
            completeApplication(id, rank, questions_answers) {
                if (!id || !rank || !questions_answers) return console.log('[DATABASE (update.applications.createApplication] Invalid inputs');
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('UPDATE applications SET rank=?, questions_answers=? WHERE channel_id=?').run(rank, questions_answers, id);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('UPDATE applications SET rank=?, questions_answers=? WHERE channel_id=?', [rank, questions_answers, id], (err) => {
                            if (err) reject(err);
                            resolve();
                        })
                    }
                })
            },
            setStatus(id, status) {
                if (!id || !status) return console.log('[DATABASE (update.applications.setStatus)] Invalid inputs');
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('UPDATE applications SET status=? WHERE channel_id=?').run(status, id);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('UPDATE applications SET status=? WHERE channel_id=?', [status, id], function (err) {
                            if (err) reject(err);
                            resolve();
                        })
                    }
                })
            }
        },
        roles: {
            setSavedRoles(user, roles) {
                return new Promise(async (resolve, reject) => {
                    if (!user || !user.id || !user.guild || !roles || typeof roles !== 'string') reject('[DATABASE (update.roles.setSavedRoles)] Invalid inputs');

                    if (module.exports.type === 'sqlite') {
                        const savedRoles = module.exports.sqlite.database.prepare('SELECT * FROM saved_roles WHERE user=? AND guild=?').get(user.id, user.guild.id);
                        if (!savedRoles) {
                            module.exports.sqlite.database.prepare('INSERT INTO saved_roles(user, guild, roles) VALUES(?, ?, ?)').run(user.id, user.guild.id, roles);
                            resolve();
                        } else {
                            module.exports.sqlite.database.prepare('UPDATE saved_roles SET roles=? WHERE user=? AND guild=?').run(roles, user.id, user.guild.id);
                            resolve();
                        }
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM saved_roles WHERE user=? AND guild=?', [user.id, user.guild.id], (err, rows) => {
                            if (err) reject(err);
                            if (!rows[0]) {
                                module.exports.mysql.database.query('INSERT INTO saved_roles(user, guild, roles) VALUES(?, ?, ?)', [user.id, user.guild.id, roles], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                })
                            } else {
                                module.exports.mysql.database.query('UPDATE saved_roles SET roles=? WHERE user=? AND guild=?', [roles, user.id, user.guild.id], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                })
                            }
                        })
                    }
                })
            }
        },
        games: {
            setData(user, data) {
                return new Promise(async (resolve, reject) => {
                    if (!user || !user.id || !user.guild || !data || typeof data !== 'string') reject('[DATABASE (update.games.setData)] Invalid inputs');

                    if (module.exports.type === 'sqlite') {
                        const gameData = module.exports.sqlite.database.prepare('SELECT * FROM game_data WHERE user=? AND guild=?').get(user.id, user.guild.id);
                        if (!gameData) {
                            module.exports.sqlite.database.prepare('INSERT INTO game_data(user, guild, data) VALUES(?, ?, ?)').run(user.id, user.guild.id, data);
                            resolve();
                        } else {
                            module.exports.sqlite.database.prepare('UPDATE game_data SET data=? WHERE user=? AND guild=?').run(data, user.id, user.guild.id);
                            resolve();
                        }
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM game_data WHERE user=? AND guild=?', [user.id, user.guild.id], (err, rows) => {
                            if (err) reject(err);
                            if (!rows[0]) {
                                module.exports.mysql.database.query('INSERT INTO game_data(user, guild, data) VALUES(?, ?, ?)', [user.id, user.guild.id, data], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                })
                            } else {
                                module.exports.mysql.database.query('UPDATE game_data SET data=? WHERE user=? AND guild=?', [data, user.id, user.guild.id], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                })
                            }
                        })
                    }
                })
            }
        }
    }
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065