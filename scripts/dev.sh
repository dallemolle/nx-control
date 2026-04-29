#!/bin/bash
set -e

echo "🔧 Starting NEXO CONTROL development environment..."

if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your configuration"
fi

echo "🔨 Building Docker containers..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

echo "⏳ Waiting for database to be ready..."
sleep 5

echo "📦 Generating Prisma Client..."
docker-compose -f docker-compose.yml run --rm prisma npx prisma generate

echo "🔄 Running database migrations..."
docker-compose -f docker-compose.yml run --rm prisma npx prisma db push

echo ""
echo "✅ Development environment is ready!"
echo ""
echo "📍 Services:"
echo "   - App: http://localhost:3000"
echo "   - Database: localhost:5432"
echo ""
echo "📝 Useful commands:"
echo "   - docker-compose logs -f app    # View app logs"
echo "   - docker-compose exec app sh    # Shell into app container"
echo "   - docker-compose exec db psql -U nxcontrol -d nxcontrol # PostgreSQL shell"
echo ""
echo "🔧 For development with Prisma Studio:"
echo "   - docker-compose -f docker-compose.yml run --rm prisma npx prisma studio"
echo ""
echo "🛑 To stop:"
echo "   - docker-compose down"
echo ""
echo "🗑️  To remove everything:"
echo "   - docker-compose down -v"