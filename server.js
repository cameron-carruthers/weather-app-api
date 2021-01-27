const express = require('express');
const { DateTime } = require('luxon');
const axios = require('axios');
const cors = require('cors')
require('dotenv').config()

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors())

app.get('/', async (req, res) => {

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

    res.send(arrayOfTemps.slice(0,5));
  } catch (err) {
    console.error(err);
  }
});

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`)
})