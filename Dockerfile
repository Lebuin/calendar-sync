FROM node:14

WORKDIR /opt/calendar-sync

COPY package*.json ./
RUN npm install

COPY . /opt/calendar-sync

CMD ["npm", "start"]
