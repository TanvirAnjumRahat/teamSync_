#!/bin/bash
# Quick start script for TeamSync AI development

set -e  # Exit on error

echo "╔════════════════════════════════════════╗"
echo "║   TeamSync AI - Quick Start Script     ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check Node.js installation
echo "🔍 Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install from https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js $(node --version) found"
echo "✅ npm $(npm --version) found"
echo ""

# Setup Backend
echo "📦 Setting up backend..."
cd backend
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists"
else
    echo "📝 Creating .env file (you'll need to fill in the values)"
    cat > .env << 'EOF'
# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=your_project_id_here
FIREBASE_PRIVATE_KEY=paste_your_private_key_here
FIREBASE_CLIENT_EMAIL=your_service_account_email_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
EOF
    echo "✅ .env file created at backend/.env"
    echo "❌ Please fill in the Firebase and OpenAI credentials in backend/.env"
fi

echo "📥 Installing backend dependencies..."
npm install
echo "✅ Backend dependencies installed"
echo ""

# Setup Frontend
echo "📦 Setting up frontend..."
cd ../frontend

if [ -f ".env.local" ]; then
    echo "⚠️  .env.local file already exists"
else
    echo "📝 Creating .env.local file (you'll need to fill in the values)"
    cat > .env.local << 'EOF'
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:5000/api
EOF
    echo "✅ .env.local file created at frontend/.env.local"
    echo "❌ Please fill in the Firebase configuration in frontend/.env.local"
fi

echo "📥 Installing frontend dependencies..."
npm install
echo "✅ Frontend dependencies installed"
echo ""

echo "╔════════════════════════════════════════╗"
echo "║    ✅ Setup Complete!                  ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "📝 Next Steps:"
echo "1. Fill in Firebase config in frontend/.env.local"
echo "2. Fill in Firebase Admin & OpenAI keys in backend/.env"
echo ""
echo "🚀 To start development:"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd backend && npm run dev"
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd frontend && npm run dev"
echo ""
echo "Then open: http://localhost:3000"
echo ""
echo "📚 For detailed setup instructions, see SETUP_GUIDE.md"
