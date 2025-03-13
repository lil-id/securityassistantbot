# Use the Zenika image with Puppeteer support
FROM zenika/alpine-chrome:with-puppeteer

USER root

# Install necessary utilities
RUN apk add --no-cache shadow docker-cli tzdata

# Fix potential conflict if "ping" is using GID 999
RUN if [ "$(getent group ping | cut -d: -f3)" = "999" ]; then groupmod -g 1999 ping; fi

# Ensure docker group exists
RUN addgroup -g 999 docker && adduser chrome docker

# Set timezone
ENV TZ=Asia/Makassar

# Set working directory inside the container
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY --chown=chrome:chrome package*.json ./
COPY prisma ./prisma/
COPY .env /usr/src/app/.env
RUN npm install

# Copy the rest of the app files
COPY --chown=chrome:chrome . .

# Ensure scripts are executable
RUN chmod +x /usr/src/app/src/scripts/systemAccount.sh
RUN chmod +x /usr/src/app/src/scripts/systemSnapshot.sh

# Expose necessary ports
EXPOSE 3001

# Command to start the application
CMD ["npm", "run", "migration"]
