#!/bin/bash

# Quick Environment Variable Copy Script for StonecloughHub
# Usage: ./scripts/copy-env.sh [platform]

platform=${1:-"help"}

case $platform in
    "vercel"|"v")
        echo "📋 Copying Vercel environment variables to clipboard..."
        if command -v xclip &> /dev/null; then
            cat .env.vercel | xclip -selection clipboard
            echo "✅ Vercel environment variables copied to clipboard!"
        elif command -v pbcopy &> /dev/null; then
            cat .env.vercel | pbcopy
            echo "✅ Vercel environment variables copied to clipboard!"
        else
            echo "📄 Vercel environment variables:"
            cat .env.vercel
        fi
        ;;
    "railway"|"r")
        echo "📋 Copying Railway environment variables to clipboard..."
        if command -v xclip &> /dev/null; then
            cat .env.railway | xclip -selection clipboard
            echo "✅ Railway environment variables copied to clipboard!"
        elif command -v pbcopy &> /dev/null; then
            cat .env.railway | pbcopy
            echo "✅ Railway environment variables copied to clipboard!"
        else
            echo "📄 Railway environment variables:"
            cat .env.railway
        fi
        ;;
    "production"|"prod"|"p")
        echo "📋 Copying production environment variables to clipboard..."
        if command -v xclip &> /dev/null; then
            cat .env.production | xclip -selection clipboard
            echo "✅ Production environment variables copied to clipboard!"
        elif command -v pbcopy &> /dev/null; then
            cat .env.production | pbcopy
            echo "✅ Production environment variables copied to clipboard!"
        else
            echo "📄 Production environment variables:"
            cat .env.production
        fi
        ;;
    "netlify"|"n")
        echo "📋 Creating Netlify environment variables..."
        netlify_env="NODE_ENV=production
VITE_SUPABASE_URL=https://mkvrdehodkxzhjxubdzu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rdnJkZWhvZGt4emhqeHViZHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1OTMyNjEsImV4cCI6MjA3MTE2OTI2MX0.UKgtWb20girva7LZAL829hC9-HjMISBkCZjT_HdPWus
VITE_API_URL=https://your-app.netlify.app"
        
        if command -v xclip &> /dev/null; then
            echo "$netlify_env" | xclip -selection clipboard
            echo "✅ Netlify environment variables copied to clipboard!"
        elif command -v pbcopy &> /dev/null; then
            echo "$netlify_env" | pbcopy
            echo "✅ Netlify environment variables copied to clipboard!"
        else
            echo "📄 Netlify environment variables:"
            echo "$netlify_env"
        fi
        ;;
    "help"|"h"|*)
        echo "🚀 StonecloughHub Environment Variable Copy Tool"
        echo "================================================"
        echo ""
        echo "Usage: ./scripts/copy-env.sh [platform]"
        echo ""
        echo "Available platforms:"
        echo "  vercel, v      - Copy Vercel environment variables"
        echo "  railway, r     - Copy Railway environment variables"
        echo "  netlify, n     - Copy Netlify environment variables"
        echo "  production, p  - Copy production environment variables"
        echo "  help, h        - Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./scripts/copy-env.sh vercel"
        echo "  ./scripts/copy-env.sh railway"
        echo "  ./scripts/copy-env.sh netlify"
        ;;
esac
