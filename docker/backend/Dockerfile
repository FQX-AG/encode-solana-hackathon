FROM node:21.1.0-alpine as development
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
RUN pnpm --filter backend run build

FROM node:21.1.0-alpine as production
WORKDIR /usr/src/app
RUN npm install -g pnpm

# install production dependencies
COPY package*.json ./
COPY pnpm*.yaml ./
COPY backend/package.json ./backend/
COPY programs/package.json ./programs/
RUN pnpm install --production

# copy built files
COPY --from=development /usr/src/app/backend/dist ./backend/dist
COPY --from=development /usr/src/app/programs/dist ./programs/dist
EXPOSE 8080
CMD ["pnpm", "--filter", "backend", "run", "start:prod"]
