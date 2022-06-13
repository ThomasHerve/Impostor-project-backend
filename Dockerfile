FROM node:latest

RUN mkdir workspace
ADD src /workspace
ADD package.json /workspace
ADD package-lock.json /workspace
RUN npm install

CMD cd /workspace/src/main-server && node server.mjs