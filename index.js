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

// ==================nodemailer==================
const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
    service: "outlook",
    auth: {
        user: process.env.TRANSPORTER_AUTH_USER, // generated ethereal user
        pass: process.env.TRANSPORTER_AUTH_PASSWORD, // generated ethereal password
    },
});

app.get("/", (req, res) => {
    res.json("OK");
});

app.get("/messages", async (req, res) => {
    await connection
        .promise()
        .query(`SELECT * from messages`)
        .then(([rows, fields]) => {
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

app.get("/messages/:id", async (req, res) => {
    await connection
        .promise()
        .query(`SELECT * from messages where message_id = ${req.params.id}`)
        .then(([rows, fields]) => {
            if (rows.length == 0) {
                res.send({
                    success: false,
                    message: "Message not found",
                });
                return;
            }
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
        .then(async ([rows, fields]) => {
            await transporter
                .sendMail({
                    from: `"Portfolio Site" ${process.env.TRANSPORTER_AUTH_USER}`, // sender address
                    to: process.env.RECEIVER_EMAIL, // list of receivers
                    subject: `[Message from site]${messageTitle}`, // Subject line
                    // text: "Hello world?", // plain text body
                    html: `<p>The user, ${req.body.messageTitle}, has sent you the following message:</p>
                <p>${req.body.messageContent}</p>
                <p>Please get back by replying to this email ASAP: ${req.body.senderEmail}</p>`, // html body
                })
                .then((result) => {
                    res.send({
                        success: true,
                        data: rows.insertId,
                    });
                });
        })
        .catch((err) => {
            res.send({
                success: false,
                message: err,
            });
        });
});

app.put("/messages/:id", async (req, res) => {
    await connection
        .promise()
        .query(
            `UPDATE messages SET message_status = ${req.body.status} where message_id = ${req.params.id}`
        )
        .then(([rows, fields]) => {
            if (rows.affectedRows == 0) {
                res.send({
                    success: false,
                    message: "Message not found",
                });
                return;
            }
            res.send({
                success: true,
                message: "Updated",
            });
        })
        .catch((err) => {
            res.send({
                success: false,
                message: err,
            });
        });
});

app.delete("/messages/:id", async (req, res) => {
    await connection
        .promise()
        .query(`DELETE FROM messages WHERE message_id = ${req.params.id}`)
        .then(([rows, fields]) => {
            if (rows.affectedRows == 0) {
                res.send({
                    success: false,
                    message: "Message not found",
                });
                return;
            }
            res.send({
                success: true,
                message: "Deleted",
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
