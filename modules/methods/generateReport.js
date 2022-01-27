const Utils = require('../utils');
const { Embed, paste } = Utils;
const chalk = require('chalk');

module.exports = (bot) => {
    (async () => {
        const warnings = await require('./getWarnings')(bot);
        let index = 0;

        if (index == bot.guilds.cache.size - 1) {
            if (warnings.length > 0) {
                paste(`Created At: ${new Date().toLocaleString()}\nBot Info:\n  Tag => ${bot.user.tag}\n  ID => ${bot.user.id}\n  Guilds => ${bot.guilds.cache.size}\n  Users => ${bot.users.cache.size}\n\nWarnings:\n${warnings.map(warning => '- ' + warning).join('\n')}`)
                    .then(res => {
                        console.log(Utils.warningPrefix + "One or more errors have automatically been detected, you can view them here: " + chalk.red(res));
                    })
                    .catch(err => {
                        console.log('An error occured while creating a startup report.');
                        require('../error')(err);
                    })
            }
        }
        index++;
    })();
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065