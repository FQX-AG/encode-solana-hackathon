FROM node:21.1.0-alpine
WORKDIR /usr/src/app
RUN npm install -g pnpm
COPY package*.json ./
COPY pnpm*.yaml ./
COPY frontend/package.json ./frontend/
RUN pnpm install
COPY ./frontend/ ./frontend/
EXPOSE 3000
CMD ["pnpm", "--filter", "./frontend", "start"]