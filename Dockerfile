FROM node:lts-slim

COPY . /app/
WORKDIR /app/
RUN npm install && npm run build

ENTRYPOINT ["node", "./dist/index.js"]