FROM node:20-alpine

WORKDIR /usr/src/app

RUN apk add --no-cache openssl bash

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate --schema=prisma/schema.prisma \
    && npx prisma generate --schema=prisma/lab/schema.prisma

EXPOSE 5000

CMD ["sh", "-lc", "npx prisma migrate deploy --schema=prisma/schema.prisma && npx prisma migrate deploy --schema=prisma/lab/schema.prisma && npm run start"]
