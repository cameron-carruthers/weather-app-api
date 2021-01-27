const express = require('express');
const redis = require('redis');
const { DateTime } = require('luxon');
const axios = require('axios');
const cors = require('cors')
require('dotenv').config()

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const app = express();
const client = redis.createClient(REDIS_PORT);

const cache = (req, res, next) => {
  const { city } = req.query;

  client.get(city, (err, data) => {
    if (err) throw err;

    if (data !== null) {
      res.send(JSON.parse(data));
    } else {
      next();
    }
  })
}

app.use(cors())

app.get('/', cache, async (req, res) => {

  try {
    const response = await axios.get(`http://api.openweathermap.org/geo/1.0/direct?q=${req.query.city}&limit=1&appid=${process.env.API_KEY}`);

    const result = await axios.get(`https://api.openweathermap.org/data/2.5/onecall?lat=${response.data[0].lat}&lon=${response.data[0].lon}&exclude=hourly,minutely&appid=${process.env.API_KEY}&units=imperial`);

    const arrayOfTemps = result.data.daily.map((element) => {

      const ISO = new Date(element.dt * 1000).toISOString();

      return ({
        temp: Math.floor(element.temp.day),
        day: DateTime.fromISO(ISO).toFormat('cccc'),
        date: DateTime.fromISO(ISO).toFormat('DDD')
      })
    });

    client.setex(req.query.city, 3600, JSON.stringify(arrayOfTemps.slice(0,5)), (err) => {
      if (err) throw err;
      res.send(arrayOfTemps.slice(0,5));
    });
  } catch (err) {
    console.error(err);
  }
});

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`)
})