const Utils = require('./utils');

module.exports = async (channelID, ticket = true) => {
  const { config, lang } = Utils.variables;

  const bot = Utils.variables.bot;
  const database = require('./database.js');

  const regexs = {
    role: /<@&\d{18}>/g,
    user: /<@\d{18}>/g,
    channel: /<#\d{18}>/g
  }

  if (ticket) {
    if (!config.Tickets.Transcripts.Enabled) return;
    const ticket = await database.get.getTickets(channelID);

    const guild = bot.guilds.cache.get(ticket.guild);
    const member = guild.member(ticket.creator);

    const ticketMessages = await database.get.ticket_messages.getMessages(channelID);

    Promise.all(
      ticketMessages.map(async msg => {
        return new Promise(async (resolve, reject) => {
          msg.fields = await database.get.ticket_messages.getEmbedFields(msg.message);
          resolve();
        })
      })
    )



    function replace(text) {
      return text
        .replace(regexs.role, role => {
          const roleFound = guild.roles.cache.get(role.match(/\d+/) ? role.match(/\d+/)[0] : '');
          return roleFound ? "@" + roleFound.name : role;
        })
        .replace(regexs.user, user => {
          const userFound = guild.members.cache.get(user.match(/\d+/) ? user.match(/\d+/)[0] : '');
          return userFound ? "@" + userFound.user.tag : user;
        })
        .replace(regexs.channel, channel => {
          const channelFound = guild.channels.cache.get(channel.match(/\d+/) ? channel.match(/\d+/)[0] : '');
          return channelFound ? "#" + channelFound.name : channel;
        })
    }
    const html = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width">
        <title>Transcript - ${ticket.channel_name}</title>
      </head>
      <body>
        <div class="container">
          <p class="server-name">${require('./utils').variables.bot.guilds.cache.get(ticket.guild).name}</h1>
          <p class="ticket-name">${ticket.channel_name}</h3>
          <p class="message-count">${ticketMessages.length} messages</h4>
          <ul class="messages">
            ${ticketMessages.map(m => {
      return `
              <li>
                <br class="clear">
                <div>
                  <div class="message-info">
                    <img class="avatar" src="${m.authorAvatar}">
                    <span class="tag">${m.authorTag}</span>
                    <span class="id">${m.author}</span>
                    <span class="time">${new Date(m.created_at).toLocaleString()}</span>
                  </div>
                </div>
                ${m.content ? `<p class="message-text">${replace(m.content)}</p>` : ''}
                ${m.attachment ? `<img class="message-image" src="${m.attachment}">` : ''}
                ${m.embed_color ? `
                  <div class="embed color-${m.embed_color}">
                    <p class="embed-title">${m.embed_title ? replace(m.embed_title) : ''}</p>
                    <p class="embed-description">${m.embed_description ? replace(m.embed_description) : ''}</p>
                    ${m.fields && m.fields.length > 0 ? `
                      <ul class="fields">
                        ${m.fields.map(f => {
        return `
                              <li>
                                <p class="embed-field-name">${replace(f.name)}</p>
                                <p class="embed-field-value">${replace(f.value)}</p>
                              </li>
                          `
      }).join('')}
                            </ul>
                          ` : ''}
                  </div>
                    ` : ''}
              </li>
            `
    }).join('')}
          </ul>
        </div>
        <script>
          const embeds = document.getElementsByClassName('embed');
          for(let i = 0; i < embeds.length; i++) {
            const embed = embeds[i];
            const classes = embed.classList;
            embed.style.borderLeft = "4px solid " + classes[1].split("color-")[1];
          }
        </script>
      </body>
      <style>
      html {
        margin: 0;
        padding: 0;
      }
      body {
        background-color: #2C2F33;
      }
      p, span {
        color: white;
        font-family: sans-serif;
        margin: 3px;
      }
      .server-name {
        font-size: 25px;
        font-weight: bold;
      }
      .ticket-name {
        font-size: 22px;
      }
      .message-count {
        font-size: 20px;
        color: rgb(116, 118, 119);
      }
      .avatar {
        height: 46px;
        border-radius: 50%;
        margin-right: 5px;
      }
      ul {
        list-style-type: none;
        padding: 0;
      }
      .id {
        color: rgb(116, 118, 119);
        font-size: 15px;
      }
      .time {
        color: rgb(127, 133, 136);
      }
      .message > * {
        float: left;
      }
      .embed {
        background-color: rgb(33, 36, 41);
        margin: 5px;
        padding: 3px;
        border-radius: 5px;
        border-left: 4px solid #323aa8;
      }
      .embed-title {
        font-weight: bold;
        font-size: 17px;
      }
      .embed-description {
        font-size: 15px;
      }
      .clear { clear: both; }
      .message-text {
        color: rgb(218, 224, 227);
      }
      .tag {
        font-size: 18px;
      }
      .embed-field-name {
        font-size: 16px;
        font-weight: bold;
      }
      .embed-field-value {
        font-size: 14px;
      }
      .message-image { 
        height: 128px;
      }
      .message-info span {
        position: relative;
        bottom: 15px;
      }
      .messages li *:nth-child(3):not(span) {
        margin-left: 50px;
      }
      </style>
    </html>`;

    const channel = Utils.findChannel(config.Tickets.Transcripts.Channel, guild);
    function sendTranscript(sucessfulSend = true) {
      if (channel) channel.send({
        embed: Utils.Embed({
          title: lang.TicketModule.Transcripts.Tickets.Logs.Title,
          description: lang.TicketModule.Transcripts.Tickets.Logs.Description
            .replace(/{channel-name}/g, ticket.channel_name)
            .replace(/{user-mention}/g, member)
            .replace(/{user-id}/g, ticket.creator)
            .replace(/{user-tag}/g, member.user.tag)
            .replace(/{sent}/g, (config.Tickets.Transcripts.DMToUser ? (sucessfulSend ? lang.TicketModule.Transcripts.Tickets.SentSuccessfully : lang.TicketModule.Transcripts.Tickets.FailedToSend) : ''))
        }).embed,
        files: [
          {
            name: ticket.channel_name + '-transcript.html',
            attachment: Buffer.from(html)
          }
        ]
      })
    }
    if (config.Tickets.Transcripts.DMToUser && member) {
      member.send({
        embed: Utils.Embed({
          title: lang.TicketModule.Transcripts.Tickets.DM.Title,
          description: lang.TicketModule.Transcripts.Tickets.DM.Description.replace(/{channel-name}/g, ticket.channel_name)
        }).embed,
        files: [
          {
            name: ticket.channel_name + '-transcript.html',
            attachment: Buffer.from(html)
          }
        ]
      })
        .then(() => {
          sendTranscript();
        })
        .catch(() => {
          sendTranscript(false);
        })
    } else sendTranscript();
  } else {
    if (!config.Applications.Transcripts.Enabled) return;
    const application = await database.get.getApplications(channelID);

    const guild = bot.guilds.cache.get(application.guild);
    const member = guild.members.cache.get(application.creator);

    const applicationMessages = await database.get.application_messages.getMessages(channelID);

    Promise.all(
      applicationMessages.map(async msg => {
        return new Promise(async (resolve, reject) => {
          msg.fields = await database.get.application_messages.getEmbedFields(msg.message);
          resolve();
        })
      })
    )



    function replace(text) {
      return text
        .replace(regexs.role, role => {
          const roleFound = guild.roles.cache.get(role.match(/\d+/) ? role.match(/\d+/)[0] : '');
          return roleFound ? "@" + roleFound.name : role;
        })
        .replace(regexs.user, user => {
          const userFound = guild.members.cache.get(user.match(/\d+/) ? user.match(/\d+/)[0] : '');
          return userFound ? "@" + userFound.user.tag : user;
        })
        .replace(regexs.channel, channel => {
          const channelFound = guild.channels.cache.get(channel.match(/\d+/) ? channel.match(/\d+/)[0] : '');
          return channelFound ? "#" + channelFound.name : channel;
        })
    }
    const html = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width">
        <title>Application Transcript - ${application.channel_name}</title>
      </head>
      <body>
        <div class="container">
          <p class="server-name">${require('./utils').variables.bot.guilds.cache.get(application.guild).name}</h1>
          <p class="ticket-name">${application.channel_name}</h3>
          <p class="message-count">${applicationMessages.length} messages</h4>
          <ul class="messages">
            ${applicationMessages.map(m => {
      return `
              <li>
                <br class="clear">
                <div>
                  <div class="message-info">
                    <img class="avatar" src="${m.authorAvatar}">
                    <span class="tag">${m.authorTag}</span>
                    <span class="id">${m.author}</span>
                    <span class="time">${new Date(m.created_at).toLocaleString()}</span>
                  </div>
                </div>
                ${m.content ? `<p class="message-text">${replace(m.content)}</p>` : ''}
                ${m.attachment ? `<img class="message-image" src="${m.attachment}">` : ''}
                ${m.embed_color ? `
                  <div class="embed color-${m.embed_color}">
                    <p class="embed-title">${m.embed_title ? replace(m.embed_title) : ''}</p>
                    <p class="embed-description">${m.embed_description ? replace(m.embed_description) : ''}</p>
                    ${m.fields && m.fields.length > 0 ? `
                      <ul class="fields">
                        ${m.fields.map(f => {
        return `
                              <li>
                                <p class="embed-field-name">${replace(f.name)}</p>
                                <p class="embed-field-value">${replace(f.value)}</p>
                              </li>
                          `
      }).join('')}
                            </ul>
                          ` : ''}
                  </div>
                    ` : ''}
              </li>
            `
    }).join('')}
          </ul>
        </div>
        <script>
          const embeds = document.getElementsByClassName('embed');
          for(let i = 0; i < embeds.length; i++) {
            const embed = embeds[i];
            const classes = embed.classList;
            embed.style.borderLeft = "4px solid " + classes[1].split("color-")[1];
          }
        </script>
      </body>
      <style>
      html {
        margin: 0;
        padding: 0;
      }
      body {
        background-color: #2C2F33;
      }
      p, span {
        color: white;
        font-family: sans-serif;
        margin: 3px;
      }
      .server-name {
        font-size: 25px;
        font-weight: bold;
      }
      .ticket-name {
        font-size: 22px;
      }
      .message-count {
        font-size: 20px;
        color: rgb(116, 118, 119);
      }
      .avatar {
        height: 46px;
        border-radius: 50%;
        margin-right: 5px;
      }
      ul {
        list-style-type: none;
        padding: 0;
      }
      .id {
        color: rgb(116, 118, 119);
        font-size: 15px;
      }
      .time {
        color: rgb(127, 133, 136);
      }
      .message > * {
        float: left;
      }
      .embed {
        background-color: rgb(33, 36, 41);
        margin: 5px;
        padding: 3px;
        border-radius: 5px;
        border-left: 4px solid #323aa8;
      }
      .embed-title {
        font-weight: bold;
        font-size: 17px;
      }
      .embed-description {
        font-size: 15px;
      }
      .clear { clear: both; }
      .message-text {
        color: rgb(218, 224, 227);
      }
      .tag {
        font-size: 18px;
      }
      .embed-field-name {
        font-size: 16px;
        font-weight: bold;
      }
      .embed-field-value {
        font-size: 14px;
      }
      .message-image { 
        height: 128px;
      }
      .message-info span {
        position: relative;
        bottom: 15px;
      }
      .messages li *:nth-child(3):not(span) {
        margin-left: 50px;
      }
      </style>
    </html>`;

    const channel = Utils.findChannel(config.Applications.Transcripts.Channel, guild);
    function sendTranscript(sucessfulSend = true) {
      if (channel) channel.send({
        embed: Utils.Embed({
          title: lang.TicketModule.Transcripts.Applications.Logs.Title,
          description: lang.TicketModule.Transcripts.Applications.Logs.Description
            .replace(/{channel-name}/g, application.channel_name)
            .replace(/{user-mention}/g, member)
            .replace(/{user-id}/g, application.creator)
            .replace(/{user-tag}/g, member.user.tag)
            .replace(/{sent}/g, (config.Applications.Transcripts.DMToUser ? (sucessfulSend ? lang.TicketModule.Transcripts.Applications.SentSuccessfully : lang.TicketModule.Transcripts.Applications.FailedToSend) : ''))
        }).embed,
        files: [
          {
            name: application.channel_name + '-transcript.html',
            attachment: Buffer.from(html)
          }
        ]
      })
    }
    if (config.Applications.Transcripts.DMToUser && member) {
      member.send({
        embed: Utils.Embed({
          title: lang.TicketModule.Transcripts.Applications.DM.Title,
          description: lang.TicketModule.Transcripts.Applications.DM.Description.replace(/{channel-name}/g, application.channel_name)
        }).embed,
        files: [
          {
            name: application.channel_name + '-transcript.html',
            attachment: Buffer.from(html)
          }
        ]
      })
        .then(() => {
          sendTranscript();
        })
        .catch(() => {
          sendTranscript(false);
        })
    } else sendTranscript();
  }
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065