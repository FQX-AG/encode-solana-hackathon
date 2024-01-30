FROM node:21.1.0-alpine
WORKDIR /usr/src/app
RUN npm install -g pnpm

# install dependencies
COPY package*.json ./
COPY pnpm*.yaml ./
COPY backend/package.json ./backend/
COPY programs/package.json ./programs/
RUN pnpm install

# build
COPY ./backend/ ./backend/
COPY ./programs/ ./programs/
RUN pnpm --filter programs run build:ts
EXPOSE 3000
CMD ["pnpm", "--filter", "backend", "start"]
