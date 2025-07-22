#!/bin/sh

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Push schema changes to the database
echo "Pushing schema changes to the database..."
npx prisma db push

# Start the application
echo "Starting the application..."
node dist/index.js 