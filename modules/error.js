const fs = require('fs');
const consoleIgnore = [
    "DiscordAPIError: Unknown Message",
    "DiscordAPIError: Unknown Channel"
]
const chalk = require("chalk");
const Utils = require('../modules/utils');
const variables = require('./variables');

module.exports = (message, extraInfo = "", predefinedLine, logToConsole = true) => {
    const err = new Error();
    const line = predefinedLine ? predefinedLine : err.stack.split("\n")[2].split(" ")[6].split(/\/|\\/).pop().replace(/\)|\(/g, '');
    if (!message) return;
    if (typeof message !== "string") message = message.toString();

    const longestLine = message.split("\n").map(m => m.length).sort((a, b) => b - a)[0];
    const dashes = "-".repeat(longestLine);
    const consoleMessage = `[CALLER: ${line} | DATE: ${new Date().toLocaleString()}]\n${dashes}\n${message}\n${dashes}`;

    if (!consoleIgnore.includes(message)) {
        if (process.argv.slice(2).includes("--show-errors")) {
            console.log('\x1b[91m%s\x1b[0m', consoleMessage);
        } else {
            let addonsLocation = __dirname.slice(0, -7) + "addons\\"

            if (extraInfo.includes(addonsLocation)) {
                let addonName = extraInfo.split("\n").find(line => line.includes(addonsLocation))
                addonName = addonName.substring(addonName.lastIndexOf("\\") + 1, addonName.lastIndexOf("."));

                console.log(chalk.hex("#ff5e5e").bold("[ERROR] ") + "An unexpected error has occured from the " + chalk.bold(addonName) + " addon. " + chalk.bold("Please contact the addon developer"));
            } else if (logToConsole) console.log(chalk.hex("#ff5e5e").bold("[ERROR] ") + "An unexpected error has occured. Please contact the Corebot support team. " + chalk.bold("https://corebot.dev/support"))
        }
    }

    const fileMessage = `[CALLER: ${line} | MS: ${Date.now()} | DATE: ${new Date().toLocaleString()}]\n${dashes}\n${message}${!!extraInfo ? "\nEXTRA INFO:\n" + extraInfo : ""}\n${dashes}`;
    fs.appendFile("./errors.txt", fileMessage + "\n", (err) => {
        if (err) console.log(err);
    })

    if (variables.errors) {
        variables.errors.push({
            occuredAt: Date.now(),
            error: typeof message == 'string' ? message : message.toString(),
            caller: line
        });
    }

    return;
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065