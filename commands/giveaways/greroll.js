const Utils = require("../../modules/utils.js")
const Embed = Utils.Embed;
const lang = Utils.variables.lang;

module.exports = {
    name: 'greroll',
    run: async (bot, message, args) => {
        const giveaway = args.length > 0 ? await Utils.variables.db.get.getGiveawayFromID(args[0]) || await Utils.variables.db.get.getGiveawayFromName(args[0]) : await Utils.variables.db.get.getLatestGiveaway();
        if (args.length > 0 && !giveaway) {
            return message.channel.send(Embed({ preset: 'error', description: lang.GiveawaySystem.Commands.Greroll.Errors.InvalidGiveaway.replace(/{name}/g, args[0]) }));
        } else if (!giveaway) {
            return message.channel.send(Embed({ preset: 'error', description: lang.GiveawaySystem.Commands.Greroll.Errors.NoGiveaways }));
        } else {
            bot.guilds.cache.first().channels.cache.get(giveaway.channel).messages.fetch(giveaway.messageID).then(async msg => {
                if (!giveaway.ended) return message.channel.send(Embed({ preset: 'error', description: lang.GiveawaySystem.Commands.Greroll.Errors.GiveawayHasntEnded }));

                let winners = await Utils.variables.db.get.getGiveawayWinners(giveaway.messageID);
                let newWinners = [];
                const users = Utils.ResolveUser(message, 1) || winners;
                const reactions = await Utils.variables.db.get.getGiveawayReactions(giveaway.messageID);
                const channel = Utils.findChannel(giveaway.channel, message.guild);

                if (!channel) return message.channel.send(Embed({ preset: 'console' }));
                if (reactions.length == 0) return message.channel.send(Embed({ preset: 'error', description: lang.GiveawaySystem.Errors.NoOneEntered }));


                if (users.length !== undefined && users.length > 1) {  
    // Get reactions once at the beginning to avoid race conditions  
    let availableReactions = await Utils.variables.db.get.getGiveawayReactions(giveaway.messageID);  
      
    // Shuffle and select winners without modifying database in loop  
    const shuffled = availableReactions.sort(() => 0.5 - Math.random());  
    const selectedWinners = shuffled.slice(0, Math.min(users.length, shuffled.length));  
      
    // Update database in batch after selection  
    for (const winner of selectedWinners) {  
        newWinners.push(winner);  
        await Utils.variables.db.update.giveaways.reactions.removeReaction(giveaway.messageID, winner);  
    }  
}

                    await end()
                    channel.send(users.map(u => "<@" + u + ">")).then(m => m.delete({ timeout: 2500 }));
                } else {
                    winners.splice(winners.indexOf(users.id), 1)
                    newWinners = winners
                    let newWinner = reactions[~~(Math.random() * reactions.length)];
                    newWinners.push(newWinner);
                    if (newWinner) await Utils.variables.db.update.giveaways.reactions.removeReaction(giveaway.messageID, newWinner)

                    await end()
                    channel.send("<@" + (users.id || users) + ">").then(m => m.delete({ timeout: 2500 }));
                }

                async function end() {
                    newWinners = newWinners.filter(winner => !!winner);
                    channel.send(Utils.Embed({
                        title: lang.GiveawaySystem.GiveawayWinnersReRolled.Title,
                        description: lang.GiveawaySystem.GiveawayWinnersReRolled.Description.replace(/{winners}/g, newWinners.map(u => "<@" + u + ">").join(", ")).replace(/{prize}/g, giveaway.name),
                        footer: lang.GiveawaySystem.GiveawayWinnersReRolled.Footer
                    }));
                    msg.edit(lang.GiveawaySystem.GiveawayEndedEmbed.Content, Utils.Embed({
                        title: lang.GiveawaySystem.GiveawayEndedEmbed.Title.replace(/{giveawaytitle}/g, msg.embeds[0].title),
                        description: lang.GiveawaySystem.GiveawayEndedEmbed.Description.replace(/{winners}/g, newWinners.map(u => "<@" + u + ">").join("\n")),
                        footer: lang.GiveawaySystem.GiveawayEndedEmbed.Footer,
                        timestamp: msg.embeds[0].timestamp
                    }))
                    message.channel.send(Utils.Embed({ title: lang.GiveawaySystem.Commands.Greroll.Rerolled }));
                    await Utils.variables.db.update.giveaways.setWinners(JSON.stringify(newWinners), giveaway.messageID)
                }
            })
        }
    },
    description: "Create a new set of winners for the giveaway",
    usage: 'greroll [giveaway name] [@user]',
    aliases: []
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065
