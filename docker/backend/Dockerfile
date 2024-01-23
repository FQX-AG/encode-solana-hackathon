FROM node:21.1.0-alpine
WORKDIR /usr/src/app
RUN npm install -g pnpm
COPY package*.json ./
COPY pnpm*.yaml ./
COPY backend/package.json ./backend/
RUN pnpm install
COPY ./backend/ ./backend/
EXPOSE 3000
CMD ["pnpm", "--filter", "backend", "start"]
