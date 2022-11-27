const express = require("express");
const cors = require("cors");

// ==================initialise==================
const app = express();
app.use(cors());
app.use(express.json());

// ==================connect db==================

const mysql = require("mysql2");
require("dotenv").config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

app.get("/", (req, res) => {
    console.log("OK");
    res.json("OK");
});

app.get("/messages", async (req, res) => {
    await connection
        .promise()
        .query(`SELECT * from messages`)
        .then(([rows, fields]) => {
            console.log("results", rows);
            res.send({
                success: true,
                data: rows,
            });
        })
        .catch((err) => {
            res.send({
                success: false,
                message: err,
            });
        });
});

app.post("/messages", async (req, res) => {
    var date = new Date();
    await connection
        .promise()
        .query(
            `INSERT INTO messages
        (
        message_date,
sender_name,
        sender_contact,
        message_title,
        message_content,
        message_status)
        VALUES(
        ?,
        ?,
        ?,
        ?,
        ?,
        ?);`,
            [
                date.toISOString().slice(0, 19).replace("T", " "),
                req.body.senderName,
                req.body.senderEmail,
                req.body.messageTitle,
                req.body.messageContent,
                0,
            ]
        )
        .then(([rows, fields]) => {
            res.send({
                success: true,
                data: rows.insertId,
            });
        })
        .catch((err) => {
            res.send({
                success: false,
                message: err,
            });
        });
});

app.listen(3000);
