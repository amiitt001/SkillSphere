# Use an official, lightweight Node.js runtime
FROM node:18-slim

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage caching
COPY package*.json ./

# Install only the production dependencies
RUN npm install --production

# Copy your application source code (the 'src' folder)
COPY src ./src

# Expose the port your app runs on
EXPOSE 8080

# Define the command to run your app from its new location
CMD ["node", "src/index.js"]

