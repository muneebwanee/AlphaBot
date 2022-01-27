const Utils = require("../../modules/utils.js");
const { lang, config, embeds } = Utils.variables;
const Embed = Utils.Embed;

module.exports = {
  name: 'update',
  run: async (bot, message, args, { prefixUsed, commandUsed }) => {
    let questions = [
      lang.AdminModule.Commands.Update.Questions[0], 
      lang.AdminModule.Commands.Update.Questions[1], 
      lang.AdminModule.Commands.Update.Questions[2], 
      lang.AdminModule.Commands.Update.Questions[3]
    ]
    let answers = [];
    let toTag = [];
    let msgIDs = [];

    const askQuestion = async (i, ask = true) => {
      const question = questions[i];
      if (ask) await message.channel.send(Embed({ title: lang.AdminModule.Commands.Update.UpdateSetup.replace(/{pos}/g, (i + 1) + '/4'), description: question })).then(msg => msgIDs.push(msg.id));

      await Utils.waitForResponse(message.author.id, message.channel)
        .then(response => {
          msgIDs.push(response.id);
          if (response.content.toLowerCase() === "cancel") return message.channel.send(Embed({ preset: "error", description: lang.AdminModule.Commands.Update.SetupCanceled }))
          else if (i == 1) {
            if (response.mentions.channels.first()) {
              answers.push(response.mentions.channels.first())
            } else {
              if (response.content == "here") answers.push(message.channel);
              else if (response.content == "default") {
                let channel = Utils.findChannel(config.Channels.DefaultUpdates, message.guild);

                if (!channel) {
                  message.channel.send(Embed({ color: config.EmbedColors.Error, title: lang.AdminModule.Commands.Update.Embeds.InvalidChannel.Title, description: lang.AdminModule.Commands.Update.Embeds.InvalidChannel.Description })).then(msg => msg.delete({ timeout: 2500 }));
                  return askQuestion(i, false);
                } else answers.push(channel)
              } else {
                message.channel.send(Embed({ color: config.EmbedColors.Error, title: lang.AdminModule.Commands.Update.Embeds.InvalidChannel.Title, description: lang.AdminModule.Commands.Update.Embeds.InvalidChannel.Description })).then(msg => msg.delete({ timeout: 2500 }));
                return askQuestion(i, false);
              }
            }
          } else if (i == 2) {
            if (response.content.toLowerCase() == 'everyone') toTag = '@everyone';
            if (!!response.mentions.roles.first()) toTag = response.mentions.roles.map(r => r.id);
            if (response.content.toLowerCase().replace(/\s+/g, '').split(',').some(rolename => !!response.guild.roles.cache.find(r => r.name.toLowerCase() == rolename))) response.content.toLowerCase().replace(/\s+/g, '').split(',').forEach(c => {
              if (response.guild.roles.cache.find(r => r.name.toLowerCase() == c)) {
                toTag.push((response.guild.roles.cache.find(r => r.name.toLowerCase() == c)).id)
              }
            })
            if (typeof toTag == 'object' && toTag.length < 1) toTag == undefined
          } else {
            answers.push(response.content)
          }

          if (i >= questions.length - 1) finishUpdate();
          else askQuestion(++i);
        })
    }

    askQuestion(0)

    const finishUpdate = () => {
      if (toTag && typeof toTag == 'string') answers[1].send(toTag);
      if (toTag && typeof toTag == 'object' && toTag.length > 0) answers[1].send(toTag.map(id => '<@&' + id + '>').join(', '));

      answers[1].send(Utils.setupEmbed({
        configPath: embeds.Embeds.Update,
        thumbnail: answers[2].includes("http") ? answers[2] : undefined,
        variables: [
          ...Utils.userVariables(message.member, "user"),
          { searchFor: /{update}/g, replaceWith: answers[0] }
        ]
      }))

      msgIDs.forEach(async id => (await message.channel.messages.fetch(id)).delete());
      message.channel.send(Embed({ title: lang.AdminModule.Commands.Update.Embeds.Posted.Title, description: lang.AdminModule.Commands.Update.Embeds.Posted.Description, color: config.EmbedColors.Success }))
    }


  },
  description: "Create an update",
  usage: 'update <message>',
  aliases: []
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065