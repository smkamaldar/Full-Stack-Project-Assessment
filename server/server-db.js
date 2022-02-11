const express = require("express");
const cors = require("cors");
const { v4 } = require("uuid");
require('dotenv').config()
const { Pool } = require("pg");

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
    user: process.env.DB_USERNAME,
    host: process.env.DB_HOST,
    database: 'itube',
    password: process.env.DB_PASSWORD,
    port: 5432
})

// GET "/" , returns all videos 
app.get("/", (req, res) => {
    const { sort } = req.query;
    let query = 'SELECT * FROM videos'
    if (sort === "desc") {
        query += " ORDER BY id desc"
    } else {
        query += " ORDER BY id asc"
    }

    pool.query(query)
        .then(result => res.send(result.rows))
        .catch(error => {
            console.log(error);
            res.send(error)
        })
});

// returns a single video
app.get('/:id', (req, res) => {
    let { id } = req.params;
    console.log("id", id)
    pool.query(`SELECT * FROM videos WHERE id = $1`, [id])
        .then(result => res.send(result.rows))
        .catch(error => {
            console.log("error", error)
            res.status(500).send(error)
        })

})

// adds a video 
app.post('/', (req, res) => {
    const { title, url } = req.body;

    if (!title || !url) {
        return res.send({ msg: "url & title are mandatory" })
    }

    const urlRegex = /^(https?\:\/\/)?(www\.youtube\.com|youtu\.be)\/.+$/;
    if (!urlRegex.test(url)) {
        return res.send({ msg: "Not a valid URL!" })
    }

    pool.query("INSERT INTO videos(title, url) VALUES($1, $2)", [title, url])
        .then(result => res.send(result.rows))
        .catch(error => res.send(error))
})

// like and dislike 
app.put("/:id", (req, res) => {
    const { type } = req.body
    let { id } = req.params
    const queryUpdate = `Update videos SET rating = $1 WHERE id = $2`

    pool.query(`SELECT rating FROM videos WHERE id = $1`, [id])
        .then(result => {
            if (result.rows.length) {
                console.log(result.rows)
                let { rating } = result.rows[0]
                rating = type === "like" ? rating + 1 : rating - 1;
                pool.query(queryUpdate, [rating, id])
                    .then(result => res.send(result.rows))
                    .catch(error => res.send(error))
            }
        })
        .catch(error => {
            console.log("error", error)
            res.status(500).send(error)
        })


})

// delete a video
app.delete('/:id', (req, res) => {
    let { id } = req.params;
    pool.query(`SELECT * FROM videos WHERE id =$1`, [id])
        .then(result => {
            if (result.rows.length) {
                pool.query(`DELETE FROM videos WHERE id = $1`, [id])
                    .then(() => {
                        res.send(`Video deleted`)
                    })
                    .catch(error => {
                        console.log(error);
                        res.status(500).send(error);
                    })
            } else {
                return res.send({ error: "you cannot delete this video!" })
            }
        }).catch(error => {
            console.log(error);
            res.status(500).send(error);
        })

})

const port = process.env.PORT;
app.listen(port, () => console.log(`Listening on port ${port}`));