# Use Python base image
FROM python:3.9-slim

# Install Node.js and build essentials
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire project
COPY . .

# Build the frontend
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Return to root
WORKDIR /app

# Create an entrypoint script to run both servers
RUN echo '#!/bin/bash\n\
# Start the Python AI server in the background\n\
python -m uvicorn server:app --host 0.0.0.0 --port 8000 &\n\
\n\
# Start the Node.js API server (main process)\n\
node frontend/src/server.js\n\
' > /app/start.sh
RUN chmod +x /app/start.sh

# HF Spaces uses port 7860 by default
EXPOSE 7860

# Set environment variable for the Node server port
ENV PORT=7860

CMD ["/app/start.sh"]
