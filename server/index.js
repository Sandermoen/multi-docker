const express = require('express');
const cors = require('cors');
const redis = require('redis');
const { Pool } = require('pg');

const keys = require('./keys');

const app = express();
app.use(cors());
app.use(express.json());

const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort,
});

pgClient.on('connect', (client) => {
  client
    .query('CREATE TABLE IF NOT EXISTS values (number INT)')
    .catch((err) => console.log(err));
});

const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000,
});
const redisPublisher = redisClient.duplicate();

app.get('/', (_, res) => {
  res.send('Hello!');
});

app.get('/values/all', async (req, res) => {
  try {
    const values = await pgClient.query('SELECT * FROM values');
    res.send(values.rows);
  } catch (err) {
    res.status(500).send({ error: "Couldn't retrieve values." });
  }
});

app.get('/values/current', (_, res) => {
  redisClient.hgetall('values', (err, values) => {
    if (err) {
      return res.status(500).send({ error: "Couldn't retrieve values." });
    }
    res.send(values);
  });
});

app.post('/values', async (req, res) => {
  const index = req.body.index;
  if (Number(index) > 40) {
    return res.status(401).send({
      error: 'Index too large, lease choose an index below or equal to 40.',
    });
  }

  redisClient.hset('values', index, 'Nothing yet!');
  redisPublisher.publish('insert', index);
  pgClient.query(`INSERT INTO values(number) VALUES ($1)`, [index]);

  return res.send({ status: 'success' });
});

app.listen(5000, () => {
  console.log('Server listening on port 5000');
});
