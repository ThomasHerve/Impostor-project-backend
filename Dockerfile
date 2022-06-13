FROM node:14

WORKDIR /
ADD src /
ADD package.json /
ADD package-lock.json /
RUN npm --location=project install

CMD cd /src/main-server && node server.mjs