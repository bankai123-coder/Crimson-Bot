#!/bin/bash

# ═══════════════════════════════════════════════════
# CRIMSON BOT - STARTUP SCRIPT
# ═══════════════════════════════════════════════════

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║   ██████╗██████╗ ██╗███╗   ███╗███████╗ ██████╗ ███╗   ██╗   ║"
echo "║  ██╔════╝██╔══██╗██║████╗ ████║██╔════╝██╔═══██╗████╗  ██║   ║"
echo "║  ██║     ██████╔╝██║██╔████╔██║███████╗██║   ██║██╔██╗ ██║   ║"
echo "║  ██║     ██╔══██╗██║██║╚██╔╝██║╚════██║██║   ██║██║╚██╗██║   ║"
echo "║  ╚██████╗██║  ██║██║██║ ╚═╝ ██║███████║╚██████╔╝██║ ╚████║   ║"
echo "║   ╚═════╝╚═╝  ╚═╝╚═╝╚═╝     ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝   ║"
echo "║                                                                ║"
echo "║              🤖 Crimson WhatsApp Bot Launcher 🤖              ║"
echo "║                      Version 3.0.0                            ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Check Node.js
echo -e "${BLUE}🔍 Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed!${NC}"
    echo -e "${YELLOW}Please install Node.js v18 or higher${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version is too old!${NC}"
    echo -e "${YELLOW}Current version: v$NODE_VERSION${NC}"
    echo -e "${YELLOW}Required version: v18 or higher${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"
echo ""

# Check npm
echo -e "${BLUE}🔍 Checking npm...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm $(npm -v) detected${NC}"
echo ""

# Check dependencies
echo -e "${BLUE}📦 Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found${NC}"
    echo -e "${BLUE}📥 Installing dependencies...${NC}"
    npm install
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Dependencies found${NC}"
fi
echo ""

# Create directories
echo -e "${BLUE}📁 Setting up directories...${NC}"
mkdir -p auth database plugins temp downloads uploads media logs backups cache sessions
echo -e "${GREEN}✓ Directories ready${NC}"
echo ""

# Check config
echo -e "${BLUE}⚙️  Checking configuration...${NC}"
if [ ! -f "config.js" ]; then
    echo -e "${RED}❌ config.js not found!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Configuration found${NC}"
echo ""

# Start options
echo -e "${CYAN}════════════════════════════════════════${NC}"
echo -e "${YELLOW}How would you like to start the bot?${NC}"
echo -e "${CYAN}════════════════════════════════════════${NC}"
echo -e "${GREEN}1)${NC} Normal start (foreground)"
echo -e "${GREEN}2)${NC} Background start (nohup)"
echo -e "${GREEN}3)${NC} Start with screen"
echo -e "${GREEN}4)${NC} Start with pm2"
echo -e "${GREEN}5)${NC} Start with nodemon (dev mode)"
echo -e "${RED}0)${NC} Exit"
echo -e "${CYAN}════════════════════════════════════════${NC}"
echo -n "Enter your choice [0-5]: "
read choice

case $choice in
    1)
        echo -e "${GREEN}🚀 Starting Crimson Bot...${NC}"
        echo ""
        node index.js
        ;;
    2)
        echo -e "${GREEN}🚀 Starting Crimson Bot in background...${NC}"
        nohup node index.js > logs/bot.log 2>&1 &
        PID=$!
        echo $PID > .pid
        echo -e "${GREEN}✓ Bot started with PID: $PID${NC}"
        echo -e "${CYAN}📄 Logs: logs/bot.log${NC}"
        echo -e "${YELLOW}ℹ️  To stop: kill $PID${NC}"
        ;;
    3)
        echo -e "${GREEN}🚀 Starting Crimson Bot with screen...${NC}"
        
        if ! command -v screen &> /dev/null; then
            echo -e "${RED}❌ screen is not installed!${NC}"
            echo -e "${YELLOW}Install with: pkg install screen${NC}"
            exit 1
        fi
        
        screen -dmS crimson node index.js
        echo -e "${GREEN}✓ Bot started in screen session 'crimson'${NC}"
        echo -e "${YELLOW}ℹ️  To attach: screen -r crimson${NC}"
        echo -e "${YELLOW}ℹ️  To detach: Ctrl+A then D${NC}"
        ;;
    4)
        echo -e "${GREEN}🚀 Starting Crimson Bot with pm2...${NC}"
        
        if ! command -v pm2 &> /dev/null; then
            echo -e "${YELLOW}⚠️  pm2 is not installed${NC}"
            echo -e "${BLUE}📥 Installing pm2...${NC}"
            npm install -g pm2
        fi
        
        pm2 start index.js --name crimson-bot
        pm2 save
        pm2 startup
        echo -e "${GREEN}✓ Bot started with pm2${NC}"
        echo -e "${YELLOW}ℹ️  Commands:${NC}"
        echo -e "  - pm2 list       (show processes)"
        echo -e "  - pm2 logs       (show logs)"
        echo -e "  - pm2 restart crimson-bot"
        echo -e "  - pm2 stop crimson-bot"
        echo -e "  - pm2 delete crimson-bot"
        ;;
    5)
        echo -e "${GREEN}🚀 Starting Crimson Bot with nodemon...${NC}"
        
        if ! command -v nodemon &> /dev/null; then
            echo -e "${YELLOW}⚠️  nodemon is not installed${NC}"
            echo -e "${BLUE}📥 Installing nodemon...${NC}"
            npm install -g nodemon
        fi
        
        nodemon index.js
        ;;
    0)
        echo -e "${YELLOW}👋 Goodbye!${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Invalid choice!${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${CYAN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Startup complete!${NC}"
echo -e "${CYAN}════════════════════════════════════════${NC}"
