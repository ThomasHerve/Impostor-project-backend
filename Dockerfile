FROM ubuntu

WORKDIR /
RUN apt-get update
RUN apt-get install -y nodejs
RUN apt-get install -y npm
RUN npm install n
RUN n 14
ADD src /
ADD package.json /
ADD package-lock.json /
RUN npm --location=project install

CMD cd /src/main-server && node server.mjs