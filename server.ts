import { Client } from "pg";
import { config } from "dotenv";
import express from "express";
import cors from "cors";

config(); //Read .env file lines as though they were env vars.

//Call this script with the environment variable LOCAL set if you want to connect to a local db (i.e. without SSL)
//Do not set the environment variable LOCAL if you want to connect to a heroku DB.

//For the ssl property of the DB connection config, use a value of...
// false - when connecting to a local DB
// { rejectUnauthorized: false } - when connecting to a heroku DB
const herokuSSLSetting = { rejectUnauthorized: false }
const sslSetting = process.env.LOCAL ? false : herokuSSLSetting
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()) //add CORS support to each following route handler

const client = new Client(dbConfig);
client.connect();

app.get("/", async (req, res) => {
  const dbres = await client.query('select * from posts order by post_date desc');
  res.status(200).json({data: dbres.rows});
});

app.get<{id: string}>("/:id", async (req, res) => {
  const dbres = await client.query('select * from posts where id=$1', [parseInt(req.params.id)]);
  if (dbres.rowCount === 0) {
    res.status(404).json({status: "no post with that id"})
  } else {
    res.status(200).json({data: dbres.rows});
  }
});

app.post<{}, {}, {post: string}>("/", async (req, res) => {
  const {post} = req.body;
  if (typeof post === 'string') {
    const dbres = await client.query('insert into posts (post) values ($1)', [post]);
    res.status(200).json({status: "succes"});
  } {
    res.status(400).json({status: "wrong post type"});
  }
});

app.delete<{id: string}>("/:id", async (req, res) => {
  const dbres = await client.query('delete from posts where id=$1', [parseInt(req.params.id)]);
  if (dbres.rowCount === 1) {
    res.status(200).json({status: "success"});
  } else {
    res.status(404).json({status: "no post with that id"});
  }
});

//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw 'Missing PORT environment variable.  Set it in .env file.';
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
