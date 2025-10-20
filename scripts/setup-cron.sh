#!/bin/bash
# Setup script for GDPR scheduled deletion cron job
# This script helps configure the cron job on your server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}GDPR Scheduled Deletion - Cron Setup${NC}"
echo -e "${GREEN}======================================${NC}\n"

# Get the project directory (parent of scripts directory)
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT_PATH="$PROJECT_DIR/scripts/process-scheduled-deletions.ts"
LOG_DIR="$PROJECT_DIR/logs"
LOG_FILE="$LOG_DIR/gdpr-deletions.log"

echo -e "${YELLOW}Project directory:${NC} $PROJECT_DIR"
echo -e "${YELLOW}Script location:${NC} $SCRIPT_PATH"
echo -e "${YELLOW}Log directory:${NC} $LOG_DIR\n"

# Check if script exists
if [ ! -f "$SCRIPT_PATH" ]; then
    echo -e "${RED}Error: Deletion script not found at $SCRIPT_PATH${NC}"
    exit 1
fi

# Create logs directory if it doesn't exist
if [ ! -d "$LOG_DIR" ]; then
    echo -e "${YELLOW}Creating logs directory...${NC}"
    mkdir -p "$LOG_DIR"
    echo -e "${GREEN}✓ Logs directory created${NC}\n"
fi

# Check if npx is available
if ! command -v npx &> /dev/null; then
    echo -e "${RED}Error: npx not found. Please install Node.js first.${NC}"
    exit 1
fi

# Check if tsx is available
if ! npx tsx --version &> /dev/null; then
    echo -e "${YELLOW}Installing tsx...${NC}"
    npm install -g tsx
    echo -e "${GREEN}✓ tsx installed${NC}\n"
fi

# Generate cron job entry
CRON_COMMAND="0 2 * * * cd $PROJECT_DIR && npx tsx $SCRIPT_PATH >> $LOG_FILE 2>&1"

echo -e "${GREEN}Cron job configuration:${NC}"
echo -e "${YELLOW}Schedule:${NC} Daily at 2:00 AM"
echo -e "${YELLOW}Command:${NC}"
echo -e "  $CRON_COMMAND\n"

# Ask user if they want to install the cron job
read -p "Do you want to install this cron job? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "\n${YELLOW}Cron job not installed.${NC}"
    echo -e "${YELLOW}To install manually, run:${NC}"
    echo -e "  crontab -e"
    echo -e "${YELLOW}Then add this line:${NC}"
    echo -e "  $CRON_COMMAND\n"
    exit 0
fi

# Backup existing crontab
echo -e "\n${YELLOW}Backing up existing crontab...${NC}"
crontab -l > "$PROJECT_DIR/crontab.backup" 2>/dev/null || true
echo -e "${GREEN}✓ Crontab backed up to crontab.backup${NC}"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "process-scheduled-deletions.ts"; then
    echo -e "${YELLOW}Warning: A similar cron job already exists.${NC}"
    read -p "Do you want to replace it? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Cron job not modified.${NC}"
        exit 0
    fi
    # Remove existing job
    crontab -l 2>/dev/null | grep -v "process-scheduled-deletions.ts" | crontab -
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_COMMAND") | crontab -

echo -e "${GREEN}✓ Cron job installed successfully!${NC}\n"

# Verify installation
echo -e "${GREEN}Verifying installation...${NC}"
if crontab -l | grep -q "process-scheduled-deletions.ts"; then
    echo -e "${GREEN}✓ Cron job verified${NC}\n"

    echo -e "${GREEN}Current crontab:${NC}"
    crontab -l | grep "process-scheduled-deletions.ts"

    echo -e "\n${GREEN}======================================${NC}"
    echo -e "${GREEN}Setup Complete!${NC}"
    echo -e "${GREEN}======================================${NC}\n"

    echo -e "${YELLOW}The deletion script will run daily at 2:00 AM${NC}"
    echo -e "${YELLOW}Logs will be saved to: $LOG_FILE${NC}\n"

    echo -e "${YELLOW}To test the script manually, run:${NC}"
    echo -e "  cd $PROJECT_DIR && npx tsx $SCRIPT_PATH\n"

    echo -e "${YELLOW}To view logs:${NC}"
    echo -e "  tail -f $LOG_FILE\n"

    echo -e "${YELLOW}To remove the cron job:${NC}"
    echo -e "  crontab -e  # then delete the line${NC}\n"
else
    echo -e "${RED}Error: Failed to verify cron job installation${NC}"
    exit 1
fi
