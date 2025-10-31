#!/bin/bash
# Fetcha Weather - Deployment Helper Script
# Run this to push to GitHub and trigger Railway deployment

set -e

echo "🚀 Fetcha Weather - Deployment Script"
echo "======================================"

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📦 Initializing Git repository..."
    git init
    git remote add origin git@github.com:Will954633/fetcha.weather.git
    echo "✅ Git initialized"
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo ""
    echo "📝 Staging all changes..."
    git add .
    
    echo ""
    read -p "Enter commit message: " commit_msg
    
    if [ -z "$commit_msg" ]; then
        commit_msg="Update deployment - $(date '+%Y-%m-%d %H:%M')"
    fi
    
    echo ""
    echo "💾 Committing changes..."
    git commit -m "$commit_msg"
    echo "✅ Changes committed"
else
    echo "ℹ️  No changes to commit"
fi

echo ""
echo "🚢 Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🎯 Next steps:"
echo "   1. Railway will automatically deploy your backend"
echo "   2. Check deployment status: https://railway.app/dashboard"
echo "   3. View logs: railway logs --follow"
echo ""
