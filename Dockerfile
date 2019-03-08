FROM node:carbon

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
COPY .eslintrc.json .eslintignore /usr/src/app/
COPY test /usr/src/app/src
COPY src /usr/src/app/src
RUN npm install

CMD [ "npm", "build" ]