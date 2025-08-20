#!/bin/bash

# StonecloughHub Deployment Setup Script
# This script helps set up environment variables for different platforms

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 StonecloughHub Deployment Setup${NC}"
echo "======================================"

# Function to display menu
show_menu() {
    echo -e "\n${YELLOW}Choose your deployment platform:${NC}"
    echo "1) Vercel (Current: stoneclough-hub.vercel.app)"
    echo "2) Railway (For custom domain stoneclough.uk)"  
    echo "3) VPS/Server Setup for stoneclough.uk"
    echo "4) Show all environment variables"
    echo "5) Exit"
}

# Function to set up Vercel
setup_vercel() {
    echo -e "\n${GREEN}Setting up Vercel deployment...${NC}"
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        echo -e "${YELLOW}Installing Vercel CLI...${NC}"
        npm install -g vercel
    fi
    
    echo -e "${BLUE}📋 Copy these environment variables to your Vercel dashboard:${NC}"
    echo "   vercel.com → Your Project → Settings → Environment Variables"
    echo ""
    cat .env.vercel
    
    echo -e "\n${YELLOW}Would you like to deploy to Vercel now? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}Deploying to Vercel...${NC}"
        vercel --prod
    fi
}

# Function to set up Railway
setup_railway() {
    echo -e "\n${GREEN}Setting up Railway deployment...${NC}"
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        echo -e "${YELLOW}Installing Railway CLI...${NC}"
        npm install -g @railway/cli
    fi
    
    echo -e "${BLUE}📋 Copy these environment variables to your Railway dashboard:${NC}"
    echo "   railway.app → Your Project → Variables"
    echo ""
    cat .env.railway
    
    echo -e "\n${YELLOW}Would you like to deploy to Railway now? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}Deploying to Railway...${NC}"
        railway login
        railway up
    fi
}

# Function to set up Netlify
setup_netlify() {
    echo -e "\n${GREEN}Setting up Netlify deployment...${NC}"
    
    # Check if Netlify CLI is installed
    if ! command -v netlify &> /dev/null; then
        echo -e "${YELLOW}Installing Netlify CLI...${NC}"
        npm install -g netlify-cli
    fi
    
    echo -e "${BLUE}📋 Set these environment variables in Netlify:${NC}"
    echo "   app.netlify.com → Site Settings → Environment Variables"
    echo ""
    echo "# Netlify Environment Variables"
    echo "NODE_ENV=production"
    echo "VITE_SUPABASE_URL=https://mkvrdehodkxzhjxubdzu.supabase.co"
    echo "VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rdnJkZWhvZGt4emhqeHViZHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1OTMyNjEsImV4cCI6MjA3MTE2OTI2MX0.UKgtWb20girva7LZAL829hC9-HjMISBkCZjT_HdPWus"
    echo "VITE_API_URL=https://your-app.netlify.app"
    
    echo -e "\n${YELLOW}Would you like to deploy to Netlify now? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}Deploying to Netlify...${NC}"
        netlify login
        netlify deploy --prod
    fi
}

# Function to set up VPS/Server for stoneclough.uk
setup_vps() {
    echo -e "\n${GREEN}Setting up VPS/Server for stoneclough.uk...${NC}"
    
    echo -e "${BLUE}📋 VPS Deployment Guide:${NC}"
    echo "   Follow the complete guide in DEPLOYMENT_GUIDE.md"
    echo ""
    echo -e "${YELLOW}Quick Start Commands:${NC}"
    echo "1. Set up your server (Ubuntu 22.04 recommended)"
    echo "2. Point DNS: stoneclough.uk → your-server-ip"
    echo "3. Clone repo and run: npm run deploy"
    echo "4. Configure Nginx with SSL"
    echo ""
    echo -e "${BLUE}Environment Variables for VPS:${NC}"
    cat .env.production
    
    echo -e "\n${YELLOW}Would you like to open the detailed deployment guide? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        if command -v less &> /dev/null; then
            less DEPLOYMENT_GUIDE.md
        else
            cat DEPLOYMENT_GUIDE.md
        fi
    fi
}

# Function to show all environment variables
show_all_env() {
    echo -e "\n${GREEN}All Environment Variables:${NC}"
    echo "=========================="
    echo ""
    echo -e "${BLUE}🔧 Development (.env):${NC}"
    cat .env | head -20
    echo "..."
    echo ""
    echo -e "${BLUE}🚀 Production (.env.production):${NC}"
    cat .env.production
    echo ""
    echo -e "${BLUE}☁️ Vercel (.env.vercel):${NC}"
    cat .env.vercel | head -20
    echo "..."
    echo ""
    echo -e "${BLUE}🚂 Railway (.env.railway):${NC}"
    cat .env.railway | head -20
    echo "..."
}

# Function to check prerequisites
check_prerequisites() {
    echo -e "${BLUE}Checking prerequisites...${NC}"
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
        exit 1
    fi
    
    # Check if git is installed
    if ! command -v git &> /dev/null; then
        echo -e "${RED}❌ Git is not installed. Please install Git first.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All prerequisites met!${NC}"
}

# Main script
main() {
    check_prerequisites
    
    while true; do
        show_menu
        echo -n "Enter your choice [1-6]: "
        read -r choice
        
        case $choice in
            1)
                setup_vercel
                ;;
            2)
                setup_railway
                ;;
            3)
                setup_netlify
                ;;
            4)
                setup_render
                ;;
            5)
                show_all_env
                ;;
            6)
                echo -e "${GREEN}👋 Happy deploying!${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}❌ Invalid option. Please choose 1-6.${NC}"
                ;;
        esac
        
        echo -e "\n${YELLOW}Press Enter to continue...${NC}"
        read -r
    done
}

# Run main function
main
