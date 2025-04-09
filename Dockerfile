# Generated by https://smithery.ai. See: https://smithery.ai/docs/config#dockerfile
FROM node:lts-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies without running scripts (we run build manually)
RUN npm install --ignore-scripts

# Copy rest of the source code
COPY . .

# Build the project
RUN npm run build

# Expose port if needed (not specified by MCP, but typically not needed)

# Define environment variables defaults (optional, override in runtime)
ENV BITHUMB_API_KEY=changeme
ENV BITHUMB_SECRET_KEY=changeme

# Start the MCP server
CMD ["node", "build/index.js"]
