FROM node:latest

WORKDIR /
ADD src /
ADD package.json /
ADD package-lock.json /
RUN npm install

CMD cd /workspace/src/main-server && node server.mjs