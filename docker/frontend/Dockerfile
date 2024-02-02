FROM node:21.1.0-alpine as development
WORKDIR /usr/src/app
RUN npm install -g pnpm

# install python3 and build tools for node-gyp
RUN apk add --no-cache python3 make g++ linux-headers eudev-dev

# install dependencies
COPY package*.json ./
COPY pnpm*.yaml ./
COPY frontend/package.json ./frontend/
COPY programs/package.json ./programs/
RUN pnpm install

# build
COPY ./frontend/ ./frontend/
COPY ./programs/ ./programs/
RUN pnpm --filter programs run build:ts
RUN pnpm --filter ./frontend run build

FROM node:21.1.0-alpine as production
WORKDIR /usr/src/app
RUN npm install -g pnpm

# install python3 and build tools for node-gyp
RUN apk add --no-cache python3 make g++ linux-headers eudev-dev

# install production dependencies
COPY package*.json ./
COPY pnpm*.yaml ./
COPY frontend/package.json ./frontend/
COPY programs/package.json ./programs/
RUN pnpm install --production

# copy built files
COPY --from=development /usr/src/app/programs/dist ./programs/dist
COPY --from=development /usr/src/app/frontend/.next ./frontend/.next

EXPOSE 3000
CMD ["pnpm", "--filter", "./frontend", "start"]