const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;

module.exports = {
    name: 'setup',
    run: async (bot, message, args) => {

        if (message.author.id !== message.guild.ownerID) return message.channel.send(Embed({ preset: "error", description: "You must be the owner of the guild in order to run this command"}))

        let missing = await require("../../modules/methods/getMissingRolesAndChannels")(bot, message.guild);

        if (!missing.roles.length && !missing.channels.text.length && !missing.channels.voice.length && !missing.channels.categories.length) return message.channel.send(Embed({ preset: "error", description: "Your server is already setup (No missing roles or channels)"}));

        message.channel.send(Embed({ title: "Creating missing roles and channels... This may take some time."}));

        let create = async () => {
            return new Promise(async resolve => {
                let log = `The following changes were made to the ${message.guild.name} guild:\n`;

                await missing.roles.forEach(role => {
                    log += `\nCreated ${role.name} role \n> Needed for the following settings:\n>  ${role.setting.join("\n>  ")}\n`
                    message.guild.roles.create({ data: { name: role.name } })
                })

                await missing.channels.text.forEach(channel => {
                    log += `\nCreated ${channel.name} text channel \n> Needed for the following settings:\n>  ${channel.setting.join("\n>  ")}\n`
                    message.guild.channels.create(channel.name, { type: "text" })
                })

                await missing.channels.voice.forEach(channel => {
                    log += `\nCreated ${channel.name} voice channel \n> Needed for the following settings:\n>  ${channel.setting.join("\n>  ")}\n`
                    message.guild.channels.create(channel.name, { type: "voice" })
                })

                await missing.channels.categories.forEach(channel => {
                    log += `\nCreated ${channel.name} category \n> Needed for the following settings:\n>  ${channel.setting.join("\n>  ")}\n`
                    message.guild.channels.create(channel.name, { type: "category" })
                })

                resolve(log)
            })
        }

        create()
        .then(async (log) => {
            message.channel.send(Embed({ author: { text: "Your server is now set up for Corebot!", icon: "https://cdn.discordapp.com/avatars/718586276210802749/479e1e16b47b1e25a2548483e14ced64.png" }, timestamp: new Date(), description: "All missing channels and roles have been created. A full log of all changes made can be viewed here: " + await Utils.paste(log) + "\n\n **Don't forget to re-order the roles if you have inheritance enabled!**"}))
        })
    },
    description: "Create any missing channels and roles for the server",
    usage: 'setup',
    aliases: ["install"]
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065