FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

# Install only production deps against the committed lock file.
# Requires backend/package-lock.json to be in sync with package.json
# (run `npm install` in ./backend and commit the lock file if `npm ci` fails).
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src

# Drop root for the running process.
USER node

ENV PORT=6000
EXPOSE 6000

# Exec form + direct node (not `npm start`) so SIGTERM reaches the process
# and Docker can stop the container cleanly.
CMD ["node", "src/server.js"]
