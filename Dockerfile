FROM node:20-alpine

WORKDIR /app

COPY src .
COPY app.js jsconfig.json package.json yarn.lock ./

RUN yarn install --frozen-lockfile

CMD ["node", "app.js"]