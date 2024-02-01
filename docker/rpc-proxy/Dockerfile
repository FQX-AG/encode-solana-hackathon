FROM node:21.1.0-alpine
WORKDIR /usr/src/app
RUN npm install -g pnpm

# install dependencies
COPY package*.json ./
COPY pnpm*.yaml ./
COPY rpc-proxy/package.json ./rpc-proxy/
RUN pnpm install

# copy and run
COPY ./rpc-proxy/ ./rpc-proxy/
EXPOSE 3000
CMD ["pnpm", "--filter", "rpc-proxy", "start"]
