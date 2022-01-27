/* const fs = require("fs");
module.exports = async (fileName) => {
    return new Promise(function(resolve, reject) {
        fs.readFile(fileName, 'utf-8', function(err, file) {
            if(err) return reject(err);
            let fileObj = {};
            let lines = file.split("\n");
            let usedLines = [];
            lines.forEach((line, index) => {
                //if the line is not a comment and is not an empty line
                if(!line.startsWith("#") && !line.match(/^(\n|\r)$/)) {
                    //get the key of the line
                    let key = line.split(": ")[0];
                    //get the value of the line
                    let value = line.split(": ")[1];
                    //if there is no value
                    if(!value) {
                        let obj = {};
                        let ln = 1;
                        while(lines[index+ln] && lines[index+ln].startsWith("  ")) {
                            let l = lines[index+ln];
                            let k = l.split(": ")[0];
                            let v = l.split(": ")[1];
                            if(parseInt(v)) v = parseInt(v);
                            else v = v.replace(/(\r|"|')/g, '').replace(/\\n/g, '\n');
                            k = k.replace(/(\r|"|')/g, '').replace(/\\n/g, '\n').split(" ").slice(2).join("");
                            obj[k] = v;
                            usedLines.push(index+ln);
                            ln++;
                        }
                        key = key.replace(/(\r|"|')/g, '').replace(/\\n/g, '\n').split("").reverse().slice(1).reverse().join("");
                        fileObj[key] = obj;

                    } else {
                        //there is a value and the line has not been used
                        if(!usedLines.includes(index)) {
                            if(parseInt(value)) value = parseInt(value);
                            else value = value.replace(/(\r|"|')/g, '').replace(/\\n/g, '\n');
                            fileObj[key] = value;
                        }
                    }
                }
            })
            resolve(fileObj);
         })
    });
}*/
const fs = require('fs');
const YAML = require('yaml');
const chalk = require('chalk');
const _ = require("lodash")
const errors = new Map()
module.exports = async function (fileName) {
    return new Promise((resolve, reject) => {
        try {
            let yml = YAML.parse(fs.readFileSync(fileName, 'utf-8'), options = { prettyErrors: true });
            if (fileName == './config.yml') {
                let objects = [
                    { path: "Join.Roles", type: "array" },
                    { path: "Join.InviteRewards.Roles",  type: "object" }, 
                    { path: "Coins.Work.Jobs", type: "array" },
                    { path: "Coins.Shop.Items", type: "array"},
                    { path: "Coins.Multipliers.Roles", type: "object" },
                    { path: "Levels.LevelRoles.LevelsToRoles", type: "object" },
                    { path: "ReactionRoles", type: "object" },
                    { path: "Moderation.AutoWarnPunishments", type: "object" }, 
                    { path: "AntiAdvertisement.Whitelist.Websites", type: "array" }, 
                    { path: "AntiAdvertisement.Whitelist.Channels", type: "array" }, 
                    { path: "Levels.BlacklistedChannels", type: "array" }, 
                    { path: "LockUnlock.Whitelisted", type: "array" }, 
                    { path: "LockUnlock.Ignore", type: "array" }, 
                    { path: "Commands.AllowedChannels", type: "array" }, 
                    { path: "ActivityCycling.Activities", type: "array" },
                    { path: "Verification.VerifiedRoles", type: "array" },
                    { path: "Logs.Enabled", type: "array"},
                    { path: "Links", type: "object"},
                    { path: "Cooldowns.Commands", type: "object"},
                    { path: "AutoAnnouncements.Announcements", type: "array"},
                    { path: "AutoResponse.Responses", type: "array"}
                ]

                objects.forEach(obj => {
                    if (obj.type == "object") {
                        let o = _.get(yml, obj.path, undefined);
                        if (!o || typeof o !== "object") _.set(yml, obj.path, {})
                    } else {
                        let arr = _.get(yml, obj.path, undefined);
                        if (!arr || !Array.isArray(arr)) _.set(yml, obj.path, [])
                    }
                })
                resolve(yml)
            } else {
                resolve(yml)
            }
        } catch (err) {
            const style = text => chalk.hex("#fce956").bold(text)
            if (!errors.has(fileName)) console.log(`${style(`[YML SYNTAX ISSUE | FILE: ${fileName}:${err.linePos.start.line}:${err.linePos.start.col} (Line: ${err.linePos.start.line})]`)} ${err.name}: ${err.message}`);
            errors.set(fileName, true)
            return reject(err)
        }
    })
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065