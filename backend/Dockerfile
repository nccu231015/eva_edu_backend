# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install any needed packages
RUN npm install

# Copy the rest of the application's source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the TypeScript code
RUN npx tsc

# Copy entrypoint script
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

# Make port 3001 available to the world outside this container
EXPOSE 3001

# Run the app when the container launches
CMD ["./entrypoint.sh"] 