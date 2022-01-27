const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const Discord = Utils.Discord;
const config = Utils.variables.config;
const lang = Utils.variables.lang;
const applyCooldown = []
module.exports = {
    name: 'work',
    run: async (bot, message, args) => {
        let jobs = config.Coins.Work.Jobs
        let prefix = await Utils.variables.db.get.getPrefixes(message.guild.id)

        // Make sure all jobs are setup correctly
        let error = false
        jobs.forEach(job => {
            let name = Object.keys(jobs)[jobs.indexOf(job)];
            if (!job.Tiers || job.Tiers.length < 1) {
                error = true
                console.log(Utils.errorPrefix + `[WORK COMMAND] ${name} is missing tiers!`);
            }
            if (job.Tiers && !job.Tiers.every((tier, i) => {
                if (i == 0) {
                    return tier.HourlyPay && tier.Name
                } else {
                    return Object.keys(tier.Requirements).length > 0 && !!tier.Requirements.TimesWorked && tier.HourlyPay && tier.Name
                }
            })) {
                error = true;
                console.log(Utils.errorPrefix + `[WORK COMMAND] All tiers in the ${name} job must have an hourly pay setting, required amount of times worked (Except for first tier), and name!`)
            }
        });
        if (error) return message.channel.send(Embed({ preset: 'error', description: lang.CoinModule.Commands.Work.Errors.InvalidJobSetup }));

        let userJob = await Utils.variables.db.get.getJobs(message.member);
        // Tell to apply if no job and send help menu
        if (!args[0] && !userJob || (args[0] && args[0] == 'help')) {
            message.channel.send(Embed({
                title: lang.CoinModule.Commands.Work.Embeds.Help.Title,
                description: lang.CoinModule.Commands.Work.Embeds.Help.Description,
                fields: [
                    { name: lang.CoinModule.Commands.Work.Embeds.Help.Fields[0], value: prefix + "work jobs" },
                    { name: lang.CoinModule.Commands.Work.Embeds.Help.Fields[1], value: prefix + "work apply <job>" },
                    { name: lang.CoinModule.Commands.Work.Embeds.Help.Fields[2], value: prefix + "work" },
                    { name: lang.CoinModule.Commands.Work.Embeds.Help.Fields[3], value: prefix + "work quit" },
                    { name: lang.CoinModule.Commands.Work.Embeds.Help.Fields[4], value: prefix + "work info" },
                    { name: lang.CoinModule.Commands.Work.Embeds.Help.Fields[5], value: prefix + "work jobinfo <job>" },
                    { name: lang.CoinModule.Commands.Work.Embeds.Help.Fields[6], value: prefix + "work help" },
                ]
            }))
            if (!args[0] && !userJob) return message.channel.send(Embed({ preset: 'error', description: lang.CoinModule.Commands.Work.Errors.ConsiderApplying })).then(msg => msg.delete({ timeout: 2500 }));
        }

        // Work
        if (!args[0] && userJob) {
            let workCooldown = await Utils.variables.db.get.getWorkCooldowns(message.member);
            if (workCooldown && +workCooldown.date > Date.now()) return message.channel.send(Embed({ preset: 'error', description: lang.CoinModule.Commands.Work.Errors.WorkCooldown.replace(/{time}/g, Utils.getTimeDifference(Date.now(), +workCooldown.date)) }));

            let job = jobs.find(job => job.Name == userJob.job);
            let shift = [4, 6, 8][Math.floor(Math.random() * 3)];
            let pay = shift * job.Tiers[userJob.tier].HourlyPay;
            let nextWorkTime = new Date()
            nextWorkTime.setHours(nextWorkTime.getHours() + config.Coins.Work.Cooldown);

            await Utils.variables.db.update.coins.setWorkCooldown(message.member, nextWorkTime.getTime())
            await Utils.variables.db.update.coins.setWorkAmount(message.member, userJob.amountOfTimesWorked + 1)
            await Utils.variables.db.update.coins.updateCoins(message.member, pay, 'add');
            message.channel.send(Embed({ color: config.EmbedColors.Success, title: lang.CoinModule.Commands.Work.Embeds.WorkComplete.Title, description: lang.CoinModule.Commands.Work.Embeds.WorkComplete.Description.replace(/{shift}/g, shift).replace(/{pay}/g, pay.toLocaleString()).replace(/{time}/g, config.Coins.Work.Cooldown == 0 ? ' now ' : Utils.getTimeDifference(new Date(), nextWorkTime)) }))


            if (job.Tiers[userJob.tier + 1]) {
                let requirements = job.Tiers[userJob.tier + 1].Requirements;
                let promote = false;

                if (requirements.Coins && parseInt(requirements.Coins)) {
                    if (requirements.Coins <= await Utils.variables.db.get.getCoins(message.member)) promote = true
                    else promote = false;
                }
                if (requirements.Exp && parseInt(requirements.Exp)) {
                    if (requirements.Exp <= (await Utils.variables.db.get.getExperience(message.member)).xp) promote = true
                    else promote = false;
                }
                if (requirements.Level && parseInt(requirements.Level)) {
                    if (requirements.Level <= (await Utils.variables.db.get.getExperience(message.member)).level) promote = true
                    else promote = false;
                }
                if (requirements.Role && message.guild.roles.cache.find(r => r.name == requirements.Role || r.id == requirements.Role)) {
                    if (message.member.roles.cache.find(r => r.name == requirements.Role || r.id == requirements.Role)) promote = true
                    else promote = false;
                }
                if (requirements.TimesWorked && parseInt(requirements.TimesWorked)) {
                    if (requirements.TimesWorked <= (await Utils.variables.db.get.getJobs(message.member)).amountOfTimesWorked) promote = true
                    else promote = false;
                }

                if (promote) {
                    await Utils.variables.db.update.coins.setJob(message.member, userJob.job, (userJob.tier + 1))
                    message.channel.send(Embed({ color: config.EmbedColors.Success, title: lang.CoinModule.Commands.Work.Embeds.Promotion.Title, description: lang.CoinModule.Commands.Work.Embeds.Promotion.Description.replace(/{tier}/g, job.Tiers[userJob.tier + 1].Name).replace(/{pay}/g, job.Tiers[userJob.tier + 1].HourlyPay) }))
                }
            }


        } else if (args[0] == 'apply') {
            if (userJob) return message.channel.send(Embed({ preset: 'error', description: lang.CoinModule.Commands.Work.Errors.AlreadyHaveJob.replace(/{prefix}/g, prefix) }));

            if (applyCooldown.find(c => c.id == message.author.id)) {
                let aCooldown = applyCooldown.find(c => c.id == message.author.id)
                if (aCooldown.date.getTime() <= Date.now()) {
                    applyCooldown.splice(applyCooldown.indexOf(applyCooldown.find(c => c.id == message.author.id)));
                }
            }

            if (!applyCooldown.find(c => c.id == message.author.id)) {
                if (!args[1]) return message.channel.send(Embed({ preset: 'invalidargs', usage: 'work apply <job>' }))

                let job = jobs.find(job => job.Name.toLowerCase() == args[1].toLowerCase())

                if (!job) return message.channel.send(Embed({ preset: 'error', description: lang.CoinModule.Commands.Work.Errors.InvalidJob.replace(/{prefix}/g, prefix) }));

                let requirements = job.Tiers[0].Requirements;
                let passedRequirements = false;

                if (requirements) {
                    if (requirements.Coins && parseInt(requirements.Coins)) {
                        if (requirements.Coins <= await Utils.variables.db.get.getCoins(message.member)) passedRequirements = true
                        else passedRequirements = false;
                    }
                    if (requirements.Exp && parseInt(requirements.Exp)) {
                        if (requirements.Exp <= (await Utils.variables.db.get.getExperience(message.member)).xp) passedRequirements = true
                        else passedRequirements = false;
                    }
                    if (requirements.Level && parseInt(requirements.Level)) {
                        if (requirements.Level <= (await Utils.variables.db.get.getExperience(message.member)).level) passedRequirements = true
                        else passedRequirements = false;
                    }
                    if (requirements.Role && message.guild.roles.find(r => r.name == requirements.Role || r.id == requirements.Role)) {
                        if (message.member.roles.find(r => r.name == requirements.Role || r.id == requirements.Role)) passedRequirements = true
                        else passedRequirements = false;
                    }
                    if (requirements.TimesWorked && parseInt(requirements.TimesWorked)) {
                        let data = await Utils.variables.db.get.getJobs(message.member)
                        if (requirements.TimesWorked <= (data && data.amountOfTimesWorked ? data.amountOfTimesWorked : 0)) passedRequirements = true
                        else passedRequirements = false;
                    }
                }

                if (passedRequirements || !requirements) {
                    await Utils.variables.db.update.coins.setJob(message.member, job.Name, 0);
                    message.channel.send(Embed({ color: config.EmbedColors.Success, title: lang.CoinModule.Commands.Work.Embeds.Applied.Title, description: lang.CoinModule.Commands.Work.Embeds.Applied.Description.replace(/{job}/g, job.Tiers[0].Name).replace(/{workplace}/g, job.Name) }))
                    let d = new Date()
                    d.setHours(d.getHours() + 24);
                    applyCooldown.push({ id: message.author.id, date: d });
                } else {
                    message.channel.send(Embed({
                        preset: 'error',
                        description: lang.CoinModule.Commands.Work.Errors.FailedRequirements
                    }))
                }
            } else {
                let date = applyCooldown.find(c => c.id == message.author.id).date
                message.channel.send(Embed({ preset: 'error', description: lang.CoinModule.Commands.Work.Errors.ApplyCooldown.replace(/{time}/g, Utils.getTimeDifference(new Date(), date)) }))
            }

        } else if (args[0] == 'jobs' || args[0] == 'list') {
            return message.channel.send(Embed({
                title: lang.CoinModule.Commands.Work.Embeds.List.Title,
                fields: jobs.map(job => {
                    let jobInfo = job.Tiers[0];
                    let requirements = Object.keys(jobInfo.Requirements).filter(requirementName => {
                        let requirement = jobInfo.Requirements[requirementName];
                        return !!requirement
                    }).map(requirementName => {
                        let requirement = jobInfo.Requirements[requirementName];
                        if (requirementName == "TimesWorked") return lang.CoinModule.Commands.Work.Requirements.TimesWorked.replace(/{requirement}/g, requirement)
                        return lang.CoinModule.Commands.Work.Requirements.Other.replace(/{requirement-name}/g, requirementName.charAt(0).toUpperCase() + requirementName.substring(1)).replace(/{requirement}/g, requirement)
                    })

                    let replace = text => {
                        return text
                            .replace(/{job-name}/g, job.Name)
                            .replace(/{job-displayName}/g, job.DisplayName)
                            .replace(/{job-pay}/g, jobInfo.HourlyPay.toLocaleString())
                            .replace(/{job-requirements}/g, requirements.join("\n") || lang.CoinModule.Commands.Work.Requirements.NoRequirements)
                    }

                    return {
                        name: replace(lang.CoinModule.Commands.Work.Embeds.List.Format[0]),
                        value: replace(lang.CoinModule.Commands.Work.Embeds.List.Format[1])
                    }
                })
            }))
        } else if (args[0] == 'quit' || args[0] == 'leave') {
            if (!userJob) return message.channel.send(Embed({ preset: 'error', description: lang.CoinModule.Commands.Work.Errors.NoJob }))

            let msg = await message.channel.send(Embed({ title: lang.CoinModule.Commands.Work.Embeds.Quit.Confirmation }));
            await msg.react('✅');
            await msg.react('❌');
            Utils.waitForReaction(['❌', '✅'], message.author.id, msg).then(async reaction => {
                msg.delete()
                if (reaction.emoji.name == '✅') {
                    await Utils.variables.db.update.coins.quitJob(message.member)
                    message.channel.send(Embed({ color: config.EmbedColors.Success, title: lang.CoinModule.Commands.Work.Embeds.Quit.Left }))
                } else message.channel.send(Embed({ preset: 'error', description: lang.CoinModule.Commands.Work.Embeds.Quit.Cancel }))
            })
        } else if (args[0] == "jobinfo") {
            if (!args[1]) return message.channel.send(Embed({ preset: 'invalidargs', usage: 'work jobinfo <job>' }))

            let job = jobs.find(job => job.Name.toLowerCase() == args.slice(1).join(" ").toLowerCase() || job.DisplayName.toLowerCase() == args.slice(1).join(" ").toLowerCase())

            if (!job) return message.channel.send(Embed({ preset: 'error', title: lang.CoinModule.Commands.Work.Embeds.JobInfo.NoJob.replace(/{jobs}/g, jobs.map(job => job.Name).join(", "))}))

            return message.channel.send(Embed({
                title: `${job.DisplayName}`,
                fields: job.Tiers.map(tier => {
                    let requirements = Object.keys(tier.Requirements).filter(requirementName => {
                        let requirement = tier.Requirements[requirementName];
                        return !!requirement
                    }).map(requirementName => {
                        let requirement = tier.Requirements[requirementName];
                        if (requirementName == "TimesWorked") return lang.CoinModule.Commands.Work.Requirements.TimesWorked.replace(/{requirement}/g, requirement)
                        return lang.CoinModule.Commands.Work.Requirements.Other.replace(/{requirement-name}/g, requirementName.charAt(0).toUpperCase() + requirementName.substring(1)).replace(/{requirement}/g, requirement)
                    })

                    let replace = text => {
                        return text
                            .replace(/{tier-name}/g, tier.Name)
                            .replace(/{job-displayName}/g, job.DisplayName)
                            .replace(/{tier-pay}/g, tier.HourlyPay.toLocaleString())
                            .replace(/{tier-requirements}/g, requirements.join("\n") || lang.CoinModule.Commands.Work.Requirements.NoRequirements)
                    }

                    return {
                        name: replace(lang.CoinModule.Commands.Work.Embeds.JobInfo.Field.Name),
                        value: replace(lang.CoinModule.Commands.Work.Embeds.JobInfo.Field.Value)
                    }
                })
            }))

        } else if (args[0] == "info") {

            if (!userJob) return message.channel.send(Embed({ preset: "error", description: lang.CoinModule.Commands.Work.Embeds.Info.NoJob }))

            let job = jobs.find(job => job.Name == userJob.job);
            let currentTier = job.Tiers[userJob.tier]
            let nextTier = job.Tiers[userJob.tier + 1]
            let workCooldown = await Utils.variables.db.get.getWorkCooldowns(message.member);

            let promotionStatus = nextTier && nextTier.Requirements ? await Promise.all(Object.keys(nextTier.Requirements).map(async requirementName => {
                if (requirementName == "TimesWorked") {
                    let amt = nextTier.Requirements[requirementName] - userJob.amountOfTimesWorked
                    if (amt < 1) return false
                    return lang.CoinModule.Commands.Work.Embeds.Info.Requirements.TimesWorked.replace(/{amount}/g, amt)
                }
                if (requirementName == "Level" || requirementName == "XP") {
                    const neededLevel = nextTier.Requirements[requirementName]
                    const level = await Utils.variables.db.get.getExperience(message.member)
                    const xpNeeded = ~~((neededLevel * (175 * neededLevel) * 0.5)) - level.xp;

                    if (requirementName == "Level") {
                        if (xpNeeded < 1) return false
                        return lang.CoinModule.Commands.Work.Embeds.Info.Requirements.Level.replace(/{level}/g, neededLevel).replace(/{xp}/g, xpNeeded)
                    }
                    if (requirementName == "XP") {
                        let amt = neededLevel - level.xp
                        if (amt < 1) return false
                        return lang.CoinModule.Commands.Work.Embeds.Info.Requirements.XP.replace(/{xp}/g, neededLevel).replace(/{amount}/g, amt)
                    }
                }
                if (requirementName == "Coins") {
                    let coins = await Utils.variables.db.get.getCoins(message.member)
                    let amt = nextTier.Requirements[requirementName] - coins
                    if (amt < 1) return false
                    return lang.CoinModule.Commands.Work.Embeds.Info.Requirements.Coins.replace(/{coins}/g, nextTier.Requirements[requirementName]).replace(/{amount}/g, amt)
                }
                if (requirementName == "Role") {
                    if (Utils.hasRole(message.member, nextTier.Requirements[requirementName])) return false
                    return lang.CoinModule.Commands.Work.Embeds.Info.Requirements.Role.replace(/{role}/g, nextTier.Requirements[requirementName])
                }
            })) : []

            let nextTierFields = nextTier ? [
                { name: lang.CoinModule.Commands.Work.Embeds.Info.Embed.Fields[4].Name, value: !promotionStatus.filter(req => req).length ? lang.CoinModule.Commands.Work.Embeds.Info.Embed.Fields[4].Value[0] : lang.CoinModule.Commands.Work.Embeds.Info.Embed.Fields[4].Value[1].replace(/{requirements}/g, promotionStatus.filter(req => req).join("\n")) },
                { name: lang.CoinModule.Commands.Work.Embeds.Info.Embed.Fields[5].Name, value: lang.CoinModule.Commands.Work.Embeds.Info.Embed.Fields[5].Value.replace(/{tier-name}/g, nextTier.Name).replace(/{tier-pay}/g, nextTier.HourlyPay) }
            ] : [{ name: lang.CoinModule.Commands.Work.Embeds.Info.Embed.Fields[4].Name, value: lang.CoinModule.Commands.Work.Embeds.Info.Embed.Fields[4].Value[2]} ]

            message.channel.send(Embed({
                title: lang.CoinModule.Commands.Work.Embeds.Info.Embed.Title,
                fields: [
                    { name: lang.CoinModule.Commands.Work.Embeds.Info.Embed.Fields[0], value: userJob.job, inline: true },
                    { name: lang.CoinModule.Commands.Work.Embeds.Info.Embed.Fields[1], value: currentTier.Name, inline: true },
                    { name: lang.CoinModule.Commands.Work.Embeds.Info.Embed.Fields[2].Name, value: lang.CoinModule.Commands.Work.Embeds.Info.Embed.Fields[2].Value.replace(/{tier-pay}/g, currentTier.HourlyPay).replace(/{times-worked}/g, userJob.amountOfTimesWorked), inline: true },
                    { name: lang.CoinModule.Commands.Work.Embeds.Info.Embed.Fields[3].Name, value: workCooldown && +workCooldown.date > Date.now() ? lang.CoinModule.Commands.Work.Embeds.Info.Embed.Fields[3].Value[0] : lang.CoinModule.Commands.Work.Embeds.Info.Embed.Fields[3].Value[1]},
                    ...nextTierFields,
                ],
                color: nextTier && !promotionStatus.filter(req => req).length ? config.EmbedColors.Success : nextTier ? config.EmbedColors.Error : "#ffd500"
            }))
        }
    },
    description: "Work at a job to earn coins",
    usage: 'work [apply/jobs/quit/jobinfo/info]',
    aliases: ['job']
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065