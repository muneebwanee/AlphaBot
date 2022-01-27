const Utils = require('../utils');
const { config, lang } = Utils.variables;
const commands = require('../handlers/CommandHandler').commands;

module.exports = {
    setup: async function () {

        let general = "";
        let tickets = "";
        let other = "";
        let coins = "";
        let exp = "";
        let minecraft = "";
        let fun = "";
        let music = "";

        let admin = "";
        let management = "";
        let moderation = "";
        let giveaways = "";

        await Utils.asyncForEach(commands, async command => {
            let cmd = await Utils.variables.db.get.getCommands(command.command)

            if (cmd && cmd.enabled == false || command.command == "verify") return;

            if (command.type == "general") {
                general += `**{prefix}${command.command}** - ${command.description}\n`
            } else if (command.type == "other") {
                other += `**{prefix}${command.command}** - ${command.description}\n`
            } else if (command.type == "coins") {
                coins += `**{prefix}${command.command}** - ${command.description}\n`
            } else if (command.type == "tickets") {
                tickets += `**{prefix}${command.command}** - ${command.description}\n`
            } else if (command.type == "exp") {
                exp += `**{prefix}${command.command}** - ${command.description}\n`
            } else if (command.type == "mod") {
                moderation += `**{prefix}${command.command}** - ${command.description}\n`
            } else if (command.type == "admin") {
                admin += `**{prefix}${command.command}** - ${command.description}\n`
            } else if (command.type == "giveaways") {
                giveaways += `**{prefix}${command.command}** - ${command.description}\n`
            } else if (command.type == 'management' || command.type == 'utils') {
                management += `**{prefix}${command.command}** - ${command.description}\n`
            } else if (command.type == "minecraft") {
                minecraft += `**{prefix}${command.command}** - ${command.description}\n`
            } else if (command.type == "fun") {
                fun += `**{prefix}${command.command}** - ${command.description}\n`
            } else if (command.type == "music") {
                music += `**{prefix}${command.command}** - ${command.description}\n`
            }
        })

        this.normal = {}
        this.normal.general = general
        this.normal.tickets = tickets
        this.normal.other = other
        this.normal.coins = coins
        this.normal.exp = exp
        this.normal.minecraft = minecraft
        this.normal.fun = fun
        this.normal.music = music

        this.staff = {}
        this.staff.admin = admin
        this.staff.management = management
        this.staff.mod = moderation
        this.staff.giveaways = giveaways
    }
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065