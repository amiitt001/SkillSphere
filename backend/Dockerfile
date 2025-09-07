# Use an official, lightweight Node.js runtime as a parent image
FROM node:18-slim

# Set the working directory inside the container to /app
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
# This is done first to take advantage of Docker's layer caching
COPY package*.json ./

# Install only the production dependencies
RUN npm install --production

# Copy the rest of your application's code (index.js, .env, etc.)
COPY . .

# Make your app's port available to the outside world
EXPOSE 8080

# Define the command to run your app
CMD ["npm", "start"]