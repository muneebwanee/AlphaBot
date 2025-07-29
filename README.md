# 🤖 AlphaBot - Advanced Discord Bot

<div align="center">

![AlphaBot Logo](https://via.placeholder.com/200x200/7289da/ffffff?text=AlphaBot)

[![Node.js](https://img.shields.io/badge/Node.js-16.0+-green.svg)](https://nodejs.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js-v13.x-blue.svg)](https://discord.js.org/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-4.4.3-red.svg)](package.json)

*A powerful, feature-rich Discord bot with music, economy, moderation, and more!*

</div>

## ✨ Features

### 🎵 Music System
- High-quality music playback with YouTube integration
- Queue management with playlist support
- Advanced controls (pause, resume, skip, stop)
- Voice channel management

### 💰 Economy System
- Virtual currency with daily rewards
- Job system with multiple tiers
- Gambling games and coin trading
- Leaderboards and statistics

### 📊 Experience & Leveling
- XP tracking and level progression
- Customizable level rewards
- Server-wide leaderboards

### 🛡️ Moderation & Administration
- Advanced permission system
- Server setup automation
- Giveaway management
- Staff help commands

### 🎮 Entertainment
- Interactive games (TicTacToe, Connect4, RPS)
- Fun commands and utilities
- Math calculator and dice rolling

### 🎫 Ticket System
- Support ticket creation and management
- Application system
- User access control

## 🚀 Quick Start

### Prerequisites
Node.js 16.9+ is required.
```bash
node --version
# Should be 16.9.0 or higher
```

### Installation
1.  **Clone the Repository**
    ```bash
    git clone https://github.com/muneebwanee/AlphaBot.git
    cd AlphaBot
    ```

2.  **Recommended: Manual Installation**
    Install dependencies manually first, then start the bot with auto-install disabled.
    ```bash
    npm install
    node index.js --no-install
    ```

3.  **Alternative: Auto-Install**
    Let the bot handle dependency installation automatically.
    ```bash
    node index.js --show-install-output
    ```

### 📋 Dependencies
The bot uses these key packages:
```json
{
  "discord.js": "^13.1.0",
  "better-sqlite3": "^7.4.3",
  "mysql": "^2.18.1",
  "@discordjs/voice": "^0.6.0",
  "ytdl-core": "^4.9.1",
  "yt-search": "^2.10.1",
  "ffmpeg-static": "^4.4.0",
  "chalk": "^4.1.2",
  "yaml": "^1.10.2"
}
```

### ⚙️ Configuration
1.  **Create Configuration File**
    Create a `config.yml` file in the root directory.

    ```yml
    # Main Bot Configuration
    Token: "YOUR_BOT_TOKEN_HERE"
    Prefix: "!"
    YouTubeAPIKey: "YOUR_YOUTUBE_API_KEY"
    
    # Database Configuration
    Database:
      Type: "sqlite" # or "mysql"
    
      # For MySQL (optional)
      MySQL:
        Host: "localhost"
        User: "root"
        Password: "password"
        Database: "alphabot"
    
    # Embed Colors
    EmbedColors:
      Success: "#00ff00"
      Error: "#ff0000"
      Info: "#0099ff"
    
    # Leaderboard Settings
    Leaderboards:
      UsersPerPage:
        Levels: 10
      FilterUnknown: true
    ```

2.  **Database Setup**
    The bot automatically creates the required database tables upon the first run.
    ```sql
    -- Auto-generated tables include:
    CREATE TABLE IF NOT EXISTS users (user TEXT, guild TEXT, coins INTEGER, xp INTEGER, level INTEGER);
    CREATE TABLE IF NOT EXISTS guilds (guild TEXT, prefix TEXT);
    CREATE TABLE IF NOT EXISTS giveaways (messageID TEXT, name TEXT, channel TEXT, guild TEXT, ended BOOLEAN, end INTEGER, winners INTEGER, creator TEXT, description TEXT);
    CREATE TABLE IF NOT EXISTS modules (name TEXT, enabled BOOLEAN);
    CREATE TABLE IF NOT EXISTS commands (name TEXT, enabled BOOLEAN);
    CREATE TABLE IF NOT EXISTS tickets (channelID TEXT, userID TEXT, guildID TEXT, reason TEXT);
    CREATE TABLE IF NOT EXISTS game_data (user TEXT, guild TEXT, data TEXT);
    ```

3.  **Discord Bot Setup**
    1.  Go to the [Discord Developer Portal](https://discord.com/developers/applications).
    2.  Create a new application.
    3.  Go to the "Bot" section and click "Add Bot".
    4.  Copy the bot's **token** and paste it into your `config.yml`.
    5.  Enable the required **Privileged Gateway Intents**:
        - ✅ Server Members Intent
        - ✅ Message Content Intent
        - ✅ Presence Intent

## 🎯 Usage Examples

### Music Commands
- `!play <song name>`: Play a song.
- `!queue`: View the current queue.
- `!skip`: Skip the current song.
- `!pause`: Pause playback.
- `!resume`: Resume playback.
- `!stop`: Stop music and clear the queue.

### Economy Commands
- `!coins`: Check your balance.
- `!daily`: Claim your daily reward.
- `!work`: Work at your job.
- `!pay <@user> <amount>`: Send coins to a user.
- `!slots <bet>`: Play the slot machine.
- `!coinflip <heads/tails> <bet>`: Flip a coin with a bet.

### Experience Commands
- `!level`: Check your level.
- `!level <@user>`: Check another user's level.
- `!leveltop`: View the level leaderboard.
- `!leveltop <page>`: View a specific page of the leaderboard.

### Giveaway Commands
- `!gcreate`: Start the interactive giveaway setup.
- `!gstop <giveaway name>`: Stop a giveaway.
- `!greroll <giveaway name>`: Reroll a giveaway winner.
- `!gdelete <giveaway name>`: Delete a giveaway.

### Admin Commands
- `!setup`: Automatically set up server roles and channels.
- `!setprefix <new prefix>`: Change the bot's prefix.
- `!staffhelp`: View the list of staff-only commands.
- `!module enable music`: Enable the music module.
- `!command disable eval`: Disable the `eval` command.

### Entertainment Commands
- `!tictactoe <@user>`: Play TicTacToe.
- `!connect4 <@user>`: Play Connect 4.
- `!rps <rock/paper/scissors>`: Play Rock Paper Scissors.
- `!8ball <question>`: Ask the Magic 8-Ball a question.
- `!math <expression>`: Solve a math problem.
- `!rolldice`: Roll a dice.

## 🏗️ Architecture

### Core Structure
```
AlphaBot/
├── 📁 addons/
│   └── 🎵 music.js         # Music system
├── 📁 commands/
│   ├── 📁 coins/          # Economy commands
│   ├── 📁 entertainment/   # Games and fun commands
│   ├── 📁 exp/             # Experience commands
│   ├── 📁 general/         # General utility commands
│   ├── 📁 giveaways/       # Giveaway system
│   ├── 📁 info/            # Information commands
│   ├── 📁 management/      # Admin commands
│   ├── 📁 minecraft/       # Minecraft integration
│   ├── 📁 staff/           # Staff utilities
│   └── 📁 tickets/         # Ticket system
├── 📁 modules/
│   ├── 🗄️ database.js      # Database abstraction layer
│   ├── 📁 handlers/        # Event & command handlers
│   ├── 📁 methods/         # Utility methods
│   └── 🎨 embed.js          # Embed generator
├── ⚙️ config.yml           # Main configuration
├── 🌐 lang.yml             # Language strings (1500+ lines)
├── 📋 commands.yml         # Command definitions & permissions
├── 🎨 embeds.yml           # Embed templates
├── 🌐 TLDs.yml            # Domain validation list
└── 📦 package.json        # Project dependencies
```

### Database Integration
The bot uses a unified database abstraction layer supporting both SQLite and MySQL.
```javascript
// Example Database Access Patterns
const coins = await Utils.variables.db.get.getCoins(member);
const xp = await Utils.variables.db.get.getExperience(member);

await Utils.variables.db.update.coins.updateCoins(member, amount, 'add');
await Utils.variables.db.update.giveaways.addGiveaway(giveawayData);
```

### Handler System
```javascript
// Command Handler Initialization
const CommandHandler = require('./modules/handlers/CommandHandler').init();

// Event Handler Initialization
const EventHandler =require('./modules/handlers/EventHandler').init(bot);
```

## 🔧 Advanced Configuration

### Custom Modules
Enable or disable entire feature sets for your server.
- `!module list`: List all available modules.
- `!module enable music`: Enable the music module.
- `!module disable coins`: Disable the economy module.
- `!module giveaways`: Check the status of the giveaway module.

### Command Management
Control individual commands.
- `!command list`: List all commands.
- `!command eval disable`: Disable the `eval` command (recommended).
- `!command setup enable`: Enable the `setup` command.

### Permission System
Configure command permissions in `commands.yml`.
```yml
Permissions:
  eval:
    - "OWNER_ID_HERE"  # Restrict dangerous commands
  setup:
    - "ADMIN_ROLE_ID"  # Admin-only commands
  staffhelp:
    - "STAFF_ROLE_ID"  # Staff commands
```

### Language Customization
Customize all bot messages in `lang.yml`.
```yml
GiveawaySystem:
  Commands:
    Gcreate:
      Embeds:
        Setup:
          Questions:
            - "How long would you like the giveaway to be?"
            - "What do you want to giveaway?"
            - "Please explain the item you are giving away."
            - "How many winners will there be?"
CoinsModule:
  Commands:
    Daily:
      Title: "💰 Daily Coins"
      Description: "You have claimed your daily **{amount}** coins!"
```

## 🚨 Security & Best Practices

-   **Disable `eval` command immediately**: `!command eval disable`
-   **Never share your bot token**.
-   Restrict admin commands to trusted users only using `commands.yml`.
-   Perform regular backups of your database (`database.db` for SQLite).
-   Monitor bot logs (`errors.txt`, `console.log`) for suspicious activity.

### Recommended Production Setup
Use a process manager like PM2 for better stability and management.
```bash
# Start with PM2
pm2 start index.js --name "AlphaBot" -- --no-install
```

### Environment Variables (Alternative)
For advanced users, you can modify the bot to use a `.env` file with `dotenv`.
```
DISCORD_TOKEN=your_bot_token_here
YOUTUBE_API_KEY=your_youtube_api_key
DATABASE_TYPE=sqlite
PREFIX=!
```

## 🐛 Troubleshooting

### Common Issues
-   **Bot won't start:**
    -   Check Node.js version (`node -v` must be 16.9+).
    -   Delete `node_modules` and `package-lock.json`, then reinstall with `npm install`.
    -   Start with debug output: `node index.js --show-install-output`

-   **Music not working:**
    -   Ensure audio dependencies are installed: `npm install @discordjs/opus ffmpeg-static`
    -   For Linux, you may need to install `ffmpeg` system-wide: `sudo apt-get install ffmpeg`

-   **Database errors:**
    -   For SQLite, ensure `better-sqlite3` is installed: `npm install better-sqlite3`.
    -   For MySQL, ensure `mysql` is installed: `npm install mysql`.
    -   Check file permissions for `database.db` if using SQLite.

-   **Permission errors:**
    -   Ensure the bot has the necessary permissions in your Discord server settings (Role > Bot Role).
    -   Required permissions include:
        -   Send Messages
        -   Embed Links
        -   Add Reactions
        -   Connect (for music)
        -   Speak (for music)
        -   Manage Messages (for giveaways)

### Log Files
The bot creates several log files in the root directory:
-   `errors.txt`: Detailed error logs.
-   `console.log`: General logs and bot activity (if configured).
-   `database.db`: The SQLite database file.

## 📈 Monitoring & Maintenance

### Health Checks
- `!botinfo`: Check the bot's status and uptime.
- `!module list`: Check the status of all modules.
- `!command list`: Check the status of all commands.
- `!stats`: View bot and database statistics (if implemented).

### Regular Maintenance
-   **Weekly:** Check `errors.txt` for recurring issues.
-   **Monthly:** Update dependencies with `npm update`.
-   **Quarterly:** Clean up the database by removing old, inactive entries.
-   **As needed:** Apply security updates and patch bugs.

### Performance Optimization
```sql
-- Database optimization (SQLite)
PRAGMA optimize;
VACUUM;

-- Example: Clear old giveaway data from the database
DELETE FROM giveaways WHERE ended = 1 AND end < (strftime('%s', 'now') - 2592000);
```

## 🤝 Contributing
1.  Fork the repository.
2.  Create a new feature branch: `git checkout -b feature/amazing-feature`
3.  Make your changes and test them thoroughly.
4.  Commit your changes: `git commit -m 'Add amazing feature'`
5.  Push to the branch: `git push origin feature/amazing-feature`
6.  Open a Pull Request.

### Code Style
-   Use 2 spaces for indentation.
-   Follow existing naming conventions.
-   Add comments for complex logic.
-   Update documentation for new features or changes.

## 📄 License
This project is licensed under the ISC License - see the `LICENSE` file for details.

## 🙏 Acknowledgments
-   [Discord.js](https://discord.js.org/) - The amazing Discord API wrapper that powers this bot.
-   [Node.js](https://nodejs.org/) - The runtime environment.
-   All the creators of the open-source packages used.
-   The community for their contributions and support.

<div align="center">

---

### 📞 Support & Links
[**GitHub Issues**](https://github.com/muneebwanee/AlphaBot/issues) | [**Website**](https://alphabot.eu.org) | [**Support Server**](https://discord.alphabot.eu.org)

Made with ❤️ by muneebwanee

⭐ **Star this repo** | 🐛 **Report a Bug** | 💡 **Request a Feature**

</div>
