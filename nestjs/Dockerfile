FROM node:20.14-alpine3.20

WORKDIR /nestjs

COPY package*.json ./

# For docker health check
RUN apk update && apk add --no-cache curl

RUN npm install -g npm@10.8.1 && npm install

# Bundle app source inside Docker image
COPY . .

# Command run from docker-compose file
