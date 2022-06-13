FROM node:latest

WORKDIR /
ADD src /
ADD package.json /
ADD package-lock.json /
RUN npm install -g npm@latest
RUN npm --location=global install

CMD cd /workspace/src/main-server && node server.mjs