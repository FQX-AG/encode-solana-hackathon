FROM node:21.6.0-alpine as dependencies
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
COPY ./frontend/package.json ./frontend/
RUN npm ci --ignore-scripts

FROM dependencies as builder
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY ./frontend ./frontend
RUN npm run build -ws
EXPOSE 3000
CMD ["npm", "run", "start", "-w", "encode-solana-hackathon-frontend"]

FROM node:21.6.0-alpine as production
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
COPY ./frontend/package.json ./frontend/
RUN npm ci --omit=dev --ignore-scripts -w encode-solana-hackathon-frontend
COPY --from=builder /usr/src/app/frontend/public ./frontend/public
COPY --from=builder /usr/src/app/frontend/.next ./frontend/.next
EXPOSE 3000
USER node
CMD ["npm", "run", "start", "-w", "encode-solana-hackathon-frontend"]
