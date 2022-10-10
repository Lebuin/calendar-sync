FROM node:14

WORKDIR /opt/calendar-sync

COPY package*.json ./
RUN npm install

COPY . /opt/calendar-sync

EXPOSE 80

CMD ["npm", "start"]
