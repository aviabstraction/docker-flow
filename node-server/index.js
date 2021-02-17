const express = require('express');
const app = express();
const dotenv = require('dotenv');
const fetch = require("node-fetch")
const redis = require("redis")


dotenv.config()



const REDIS_PORT  = process.env.REDIS_PORT
const REDIS_HOST = process.env.REDIS_HOST


const redis_client = redis.createClient({host:REDIS_HOST, port:REDIS_PORT})

const { Client } = require('pg');




// Set response
function setResponse(username, repos) {
  return `<h2>${username} has ${repos} Github repos</h2>`;
}

// Make request to Github for data
async function getRepos(req, res, next) {
  try {
    console.log('Fetching Data...');

    const { username } = req.params;

    const response = await fetch(`https://api.github.com/users/${username}`);

    const data = await response.json();

    const repos = data.public_repos;

    // Set data to Redis
    redis_client.setex(username, 3600, repos);

    res.send(setResponse(username, repos));
  } catch (err) {
    console.error(err);
    res.status(500);
  }
}

// Cache middleware
function cache(req, res, next) {
  const { username } = req.params;

  redis_client.get(username, (err, data) => {
    if (err) throw err;

    if (data !== null) {
      res.send(setResponse(username, data));
    } else {
      next();
    }
  });
}

app.get('/repos/:username', cache, getRepos);


console.log(
   process.env.DB_HOST,
   process.env.DB_PORT,
   process.env.DB_USER,
  process.env.DB_NAME,
  process.env.REDIS_PORT,
   "postgres",
)
const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  name: process.env.DB_NAME,
  password: "postgres",
})




client.connect()

client.query('CREATE TABLE IF NOT EXISTS student(name: VARCHAR(100) NOT NULL)', (err, res) => {
  console.log(err, res)
  client.end()
})

app.get('/', (req, res) => {
  res.send("Docker containerized nodejs, nginx and postgres app")
})
app.listen(5000, () => console.log('Server is upppppp and running'))
