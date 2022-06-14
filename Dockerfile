FROM ubuntu

WORKDIR /
RUN apt-get update
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_14.x | sudo bash -
RUN apt-get install -y nodejs
RUN apt-get install -y npm
ADD src /
ADD package.json /
ADD package-lock.json /
RUN npm --location=project install

CMD cd /src/main-server && node server.mjs