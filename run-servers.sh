#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}Starting Monir Bisharats E-commerce Application${NC}"
echo -e "${BLUE}=====================================================${NC}"

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

echo -e "${YELLOW}Backend directory: $BACKEND_DIR${NC}"
echo -e "${YELLOW}Frontend directory: $FRONTEND_DIR${NC}"
echo ""

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${RED}Port $1 is already in use!${NC}"
        return 1
    else
        return 0
    fi
}

# Check if ports are available
echo -e "${YELLOW}Checking if ports are available...${NC}"
if ! check_port 3001; then
    echo -e "${RED}Backend port 3001 is already in use. Please stop the process using this port.${NC}"
    exit 1
fi

if ! check_port 3000; then
    echo -e "${RED}Frontend port 3000 is already in use. Please stop the process using this port.${NC}"
    exit 1
fi

echo -e "${GREEN}Ports 3000 and 3001 are available!${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed. Please install npm first.${NC}"
    exit 1
fi

echo -e "${GREEN}Node.js and npm are installed!${NC}"
echo ""

# Check if backend directory exists and has package.json
if [ ! -d "$BACKEND_DIR" ] || [ ! -f "$BACKEND_DIR/package.json" ]; then
    echo -e "${RED}Backend directory not found or package.json missing!${NC}"
    exit 1
fi

# Check if frontend directory exists and has package.json
if [ ! -d "$FRONTEND_DIR" ] || [ ! -f "$FRONTEND_DIR/package.json" ]; then
    echo -e "${RED}Frontend directory not found or package.json missing!${NC}"
    exit 1
fi

echo -e "${GREEN}Project directories found!${NC}"
echo ""

# Install dependencies if node_modules doesn't exist
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd "$BACKEND_DIR"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install backend dependencies!${NC}"
        exit 1
    fi
    echo -e "${GREEN}Backend dependencies installed!${NC}"
fi

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd "$FRONTEND_DIR"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install frontend dependencies!${NC}"
        exit 1
    fi
    echo -e "${GREEN}Frontend dependencies installed!${NC}"
fi

echo ""

# Start backend server
echo -e "${YELLOW}Starting backend server...${NC}"
cd "$BACKEND_DIR"
osascript -e 'tell app "Terminal" to do script "cd '"$BACKEND_DIR"' && echo \"Backend Server Starting...\" && npm start"' &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo -e "${YELLOW}Starting frontend server...${NC}"
cd "$FRONTEND_DIR"
osascript -e 'tell app "Terminal" to do script "cd '"$FRONTEND_DIR"' && echo \"Frontend Server Starting...\" && npm start"' &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}=====================================================${NC}"
echo -e "${GREEN}Both servers are starting!${NC}"
echo -e "${GREEN}=====================================================${NC}"
echo -e "${BLUE}Backend:  http://localhost:3001${NC}"
echo -e "${BLUE}Frontend: http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}The servers will open in separate Terminal windows.${NC}"
echo -e "${YELLOW}You can close this window once the servers are running.${NC}"
echo ""
echo -e "${GREEN}Press Ctrl+C to stop this script (servers will continue running)${NC}"

# Wait for user input or Ctrl+C
trap 'echo -e "\n${YELLOW}Script stopped. Servers are still running in their own windows.${NC}"; exit 0' INT
wait