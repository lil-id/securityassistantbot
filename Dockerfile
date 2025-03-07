# Use the Zenika image with Puppeteer support
FROM zenika/alpine-chrome:with-puppeteer

USER root

# Install tzdata and set timezone to Asia/Makassar
RUN apk add --no-cache tzdata
ENV TZ=Asia/Makassar

# Set working directory inside the container
WORKDIR /usr/src/app

# Switch to 'chrome' user before copying and installing
USER chrome

# Copy the package.json and package-lock.json for npm install
COPY --chown=chrome:chrome package*.json ./

COPY prisma ./prisma/

COPY .env /usr/src/app/.env

# Install dependencies
RUN npm install

# Copy the rest of your app files into the container
COPY --chown=chrome:chrome . .

# Expose the required ports
EXPOSE 3001

# Set the command to run your app. Adjust accordingly.
CMD ["npm", "run", "migration"]
