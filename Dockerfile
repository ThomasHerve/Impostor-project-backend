FROM ubuntu

WORKDIR /
RUN sudo apt-get install -y node
RUN sudo apt-get install -y npm
RUN sudo npm install n
RUN sudo n 14
ADD src /
ADD package.json /
ADD package-lock.json /
RUN npm --location=project install

CMD cd /src/main-server && node server.mjs