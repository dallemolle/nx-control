@echo off
echo 🔧 Starting NEXO CONTROL development environment...

if not exist .env (
    echo 📝 Creating .env file from example...
    copy .env.example .env
    echo ⚠️  Please update .env with your configuration
)

echo 🔨 Building Docker containers...
docker-compose build

echo 🚀 Starting services...
docker-compose up -d

echo ⏳ Waiting for database to be ready...
timeout /t 5 /nobreak > nul

echo 📦 Generating Prisma Client...
docker-compose -f docker-compose.yml run --rm prisma npx prisma generate

echo 🔄 Running database migrations...
docker-compose -f docker-compose.yml run --rm prisma npx prisma db push

echo.
echo ✅ Development environment is ready!
echo.
echo 📍 Services:
echo    - App: http://localhost:3000
echo    - Database: localhost:5432
echo.
echo 📝 Useful commands:
echo    - docker-compose logs -f app
echo    - docker-compose exec app sh
echo.
echo 🛑 To stop:
echo    - docker-compose down
echo.
echo 🗑️  To remove everything:
echo    - docker-compose down -v
echo.
pause