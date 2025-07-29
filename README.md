# 🤖 AlphaBot - Advanced Discord Bot  
  
<div align="center">  
  
![AlphaBot Logo](https://via.placeholder.com/200x200/7289da/ffffff?text=AlphaBot)  
  
[![Node.js](https://img.shields.io/badge/Node.js-16.0+-green.svg)](https://nodejs.org/)  
[![Discord.js](https://img.shields.io/badge/Discord.js-v12.2.0-blue.svg)](https://discord.js.org/)  
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)  
[![Version](https://img.shields.io/badge/Version-4.4.3-red.svg)](package.json)  
  
*A powerful, feature-rich Discord bot with music, economy, moderation, and more!*  
  
</div>  
  
## ✨ Features  
  
### 🎵 Music System  
- High-quality music playbook with YouTube integration  
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
  
```bash  
# Node.js 12+ required  [1](#header-1)
node --version  # Should be 12.0.0 or higher  
Installation
Clone the Repository
git clone https://github.com/muneebwanee/AlphaBot.git  
cd AlphaBot
Recommended: Manual Installation
# Install dependencies manually first  [2](#header-2)
npm install  
  
# Then start with auto-install disabled  [3](#header-3)
node index.js --no-install
Alternative: Auto-Install
# Let the bot handle dependency installation  [4](#header-4)
node index.js --show-install-output
📋 Dependencies
The bot uses these key packages:
{  
  "discord.js": "^12.2.0",  
  "better-sqlite3": "^7.1.0",  
  "mysql": "^2.17.1",  
  "ytdl-core": "^3.2.1",  
  "simple-youtube-api": "^5.2.1",  
  "ffmpeg-static": "^4.2.6",  
  "@discordjs/opus": "^0.3.2",  
  "chalk": "^4.1.0",  
  "yaml": "^1.9.2"  
}
⚙️ Configuration

1. Create Configuration Files
# config.yml  [5](#header-5)
Token: "YOUR_BOT_TOKEN_HERE"  
Prefix: "!"  
Database:  
  Type: "sqlite"  # or "mysql"  
    
# For MySQL (optional)  [6](#header-6)
MySQL:  
  Host: "localhost"  
  User: "root"  
  Password: "password"  
  Database: "alphabot"  
  
# YouTube API (for music)  [7](#header-7)
YouTubeAPIKey: "YOUR_YOUTUBE_API_KEY"  
  
# Embed Colors  [8](#header-8)
EmbedColors:  
  Success: "#00ff00"  
  Error: "#ff0000"  
  Info: "#0099ff"  
  
# Leaderboards  [9](#header-9)
Leaderboards:  
  UsersPerPage:  
    Levels: 10  
  FilterUnknown: true
2. Database Setup
The bot automatically creates required database tables:
-- Auto-generated tables include:  
CREATE TABLE IF NOT EXISTS users (user text, guild text, coins integer, xp integer, level integer);  
CREATE TABLE IF NOT EXISTS guilds (guild text, prefix text);  
CREATE TABLE IF NOT EXISTS giveaways (messageID text, name text, channel text, guild text, ended boolean, end integer, winners integer, creator text, description text);  
CREATE TABLE IF NOT EXISTS modules (name text, enabled boolean);  
CREATE TABLE IF NOT EXISTS commands (name text, enabled boolean);  
CREATE TABLE IF NOT EXISTS tickets (channelID text, userID text, guildID text, reason text);  
CREATE TABLE IF NOT EXISTS game_data (user text, guild text, data text);
3. Discord Bot Setup
Go to Discord Developer Portal
Create a new application
Go to "Bot" section
Copy the token to your config.yml
Enable required intents:
✅ Server Members Intent
✅ Message Content Intent
✅ Presence Intent
🎯 Usage Examples

Music Commands
!play Never Gonna Give You Up    # Play a song  
!queue                          # View current queue  
!skip                          # Skip current song  
!pause                         # Pause playback  
!resume                        # Resume playback  
!stop                          # Stop music and clear queue
Economy Commands
!coins                         # Check your balance  
!daily                         # Claim daily reward  
!work                          # Work at your job  
!pay @user 100                 # Send coins to user  
!slots 50                      # Play slot machine  
!coinflip heads 25             # Flip coin with bet
Experience Commands
!level                         # Check your level  
!level @user                   # Check user's level  
!leveltop                      # View leaderboard  
!leveltop 2                    # View page 2 of leaderboard
Giveaway Commands
!gcreate                       # Create a giveaway  
!gstop GiveawayName           # Stop a giveaway  
!greroll GiveawayName         # Reroll giveaway winner  
!gdelete GiveawayName         # Delete a giveaway
Admin Commands
!setup                         # Auto-setup server  
!setprefix $                   # Change bot prefix  
!staffhelp                     # Staff command help  
!module enable music           # Enable music module  
!command disable eval          # Disable eval command
Entertainment Commands
!tictactoe @user              # Play TicTacToe  
!connect4 @user               # Play Connect 4  
!rps rock                     # Rock Paper Scissors  
!8ball Will it rain?          # Magic 8-ball  
!math 2+2*3                   # Calculator  
!rolldice                     # Roll a dice
🏗️ Architecture

Core Structure
AlphaBot/  
├── 📁 commands/           # Command modules  
│   ├── 📁 coins/         # Economy commands  
│   ├── 📁 exp/           # Experience commands  
│   ├── 📁 giveaways/     # Giveaway system  
│   ├── 📁 management/    # Admin commands  
│   ├── 📁 staff/         # Staff utilities  
│   ├── 📁 entertainment/ # Games and fun  
│   ├── 📁 general/       # General utilities  
│   ├── 📁 info/          # Information commands  
│   ├── 📁 minecraft/     # Minecraft integration  
│   └── 📁 tickets/       # Ticket system  
├── 📁 addons/            # Feature addons  
│   └── 🎵 music.js       # Music system  
├── 📁 modules/           # Core modules  
│   ├── 🗄️ database.js    # Database abstraction  
│   ├── 📁 handlers/      # Event & command handlers  
│   ├── 📁 methods/       # Utility methods  
│   └── 🎨 embed.js       # Embed generator  
├── ⚙️ config.yml         # Main configuration  
├── 🌐 lang.yml           # Language strings (1500+ lines)  
├── 📋 commands.yml       # Command definitions  
├── 🎨 embeds.yml         # Embed templates  
├── 🌐 TLDs.yml           # Domain validation  
└── 📦 package.json       # Dependencies  
Database Integration
The bot uses a unified database abstraction supporting both SQLite and MySQL:
// Database access patterns  
const coins = await Utils.variables.db.get.getCoins(member);  
const xp = await Utils.variables.db.get.getExperience(member);  
await Utils.variables.db.update.coins.updateCoins(member, amount, 'add');  
await Utils.variables.db.update.giveaways.addGiveaway(giveawayData);
Handler System
// Command Handler initialization  
const CommandHandler = require('./modules/handlers/CommandHandler').init();  
  
// Event Handler initialization    
const EventHandler = require('./modules/handlers/EventHandler').init(bot);
🔧 Advanced Configuration

Custom Modules
Enable/disable features in your server:
!module list                  # List all modules  
!module enable music          # Enable music module  
!module disable coins         # Disable economy  
!module giveaways            # Check giveaway module status
Command Management
Control individual commands:
!command list                 # List all commands  
!command eval disable         # Disable eval command (recommended)  
!command setup enable         # Enable setup command
Permission System
Configure command permissions in commands.yml:
Permissions:  
  eval: ["OWNER_ID_HERE"]     # Restrict dangerous commands  
  setup: ["ADMIN_ROLE_ID"]    # Admin-only commands  
  staffhelp: ["STAFF_ROLE"]   # Staff commands
Language Customization
Customize all bot messages in lang.yml:
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
🚨 Security & Best Practices

⚠️ Critical Security Notes
Disable eval command immediately:
!command eval disable
Never share your bot token
Restrict admin commands to trusted users only
Regular backups of your database
Monitor bot logs for suspicious activity
Recommended Production Setup
# Production deployment with security measures  [10](#header-10)
node index.js --no-install  
  
# Or with process manager  [11](#header-11)
pm2 start index.js --name "AlphaBot" -- --no-install
Environment Variables (Alternative)
# .env file (if you modify the bot to use dotenv)  [12](#header-12)
DISCORD_TOKEN=your_bot_token_here  
YOUTUBE_API_KEY=your_youtube_api_key  
DATABASE_TYPE=sqlite  
PREFIX=!
🐛 Troubleshooting

Common Issues
Bot won't start:
# Check Node.js version  [13](#header-13)
node --version  # Must be 12+  
  
# Clear node_modules and reinstall  [14](#header-14)
rm -rf node_modules package-lock.json  
npm install  
  
# Start with debug output  [15](#header-15)
node index.js --show-install-output
Music not working:
# Install audio dependencies  [16](#header-16)
npm install @discordjs/opus ffmpeg-static  
  
# For Linux users, install additional packages  [17](#header-17)
sudo apt-get install ffmpeg
Database errors:
# For SQLite issues  [18](#header-18)
npm install better-sqlite3  
  
# For MySQL issues    [19](#header-19)
npm install mysql  
  
# Check database permissions  [20](#header-20)
ls -la *.db
Permission errors:
# Check bot permissions in Discord server  [21](#header-21)
# Required permissions:  [22](#header-22)
# - Send Messages  [23](#header-23)
# - Embed Links    [24](#header-24)
# - Add Reactions  [25](#header-25)
# - Connect (for music)  [26](#header-26)
# - Speak (for music)  [27](#header-27)
# - Manage Messages (for giveaways)  [28](#header-28)
Debug Commands
# Show installation output  [29](#header-29)
node index.js --show-install-output  
  
# Skip auto-install  [30](#header-30)
node index.js --no-install  
  
# Clear errors (if implemented)  [31](#header-31)
node index.js --clear-errors
Log Files
The bot creates several log files:
errors.txt - Error logs
console.log - General logs (if configured)
Database files (.db for SQLite)
📈 Monitoring & Maintenance

Health Checks
# Check bot status  [32](#header-32)
!botinfo  
  
# Check module status  [33](#header-33)
!module list  
  
# Check command status    [34](#header-34)
!command list  
  
# Database statistics  [35](#header-35)
!stats  # (if implemented)
Regular Maintenance
Weekly: Check error logs
Monthly: Update dependencies
Quarterly: Database cleanup
As needed: Security updates
Performance Optimization
// Monitor memory usage  
console.log('Memory usage:', process.memoryUsage());  
  
// Database optimization (SQLite)  
PRAGMA optimize;  
VACUUM;  
  
// Clear old giveaway data  
DELETE FROM giveaways WHERE ended = 1 AND end < (strftime('%s', 'now') - 2592000);
🤝 Contributing

Development Setup
Fork the repository
Create a feature branch:
git checkout -b feature/amazing-feature
Make your changes
Test thoroughly:
npm test  # (if tests exist)  
node index.js --no-install
Commit your changes:
git commit -m 'Add amazing feature'
Push to the branch:
git push origin feature/amazing-feature
Open a Pull Request
Code Style
Use 2 spaces for indentation
Follow existing naming conventions
Add comments for complex logic
Update documentation for new features
Adding New Commands
Create command file in appropriate folder
Follow existing command structure
Add language strings to lang.yml
Test thoroughly
Update documentation
📄 License

This project is licensed under the ISC License - see the LICENSE file for details.
🙏 Acknowledgments

Discord.js - Discord API wrapper
YouTube API - Music streaming
SQLite/MySQL - Database systems
FFmpeg - Audio processing
Node.js - Runtime environment
All contributors and users - Community support
📞 Support

Documentation: AlphaBot Docs
Discord Server: Join Support Server
Issues: GitHub Issues
Email: support@alphabot.eu.org
🔗 Links

Website: https://alphabot.eu.org
GitHub: https://github.com/muneebwanee/AlphaBot
Discord: https://discord.alphabot.eu.org
Documentation: https://docs.alphabot.eu.org
Made with ❤️ by muneebwanee
⭐ Star this repo | 🐛 Report Bug | 💡 Request Feature
```
