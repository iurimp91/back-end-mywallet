import express from "express";
import cors from "cors";
import pg from "pg";
import bcrypt from 'bcrypt';
import joi from "joi";
import { v4 as uuid } from "uuid";

const server = express();
server.use(cors());
server.use(express.json());

const { Pool } = pg;

const connection = new Pool({
    user: "postgres",
    password: "123456",
    host: "localhost",
    port: 5432,
    database: "mywallet",
});

server.post("/sign-up", async (req, res) => {
    const userSchema = joi.object({
        name: joi.string().min(3).max(30).trim().required(),
        email: joi.string().email().required(),
        password: joi.string().min(3).max(30).trim().required(),
    });

    try {
        const userValidation = await userSchema.validateAsync(req.body); 
        
        const { name, email, password } = req.body;

        const emailValidation = await connection.query(`
            SELECT * FROM users
            WHERE email = $1
        `, [email]);

        if(emailValidation.rows.length !== 0) return res.sendStatus(401);

        const passwordHash = bcrypt.hashSync(password, 12);

        await connection.query(`
            INSERT INTO users
            (name, email, password)
            VALUES ($1, $2, $3)
        `,[name, email, passwordHash]);

        return res.sendStatus(201);
    } catch(err) {
        if(
            err.message.includes("name")
            || err.message.includes("email")
            || err.message.includes("password")
        ) {
            console.log(err.message);
            return res.sendStatus(400);
        } else {
            console.log(err.message);
            return res.sendStatus(500);
        }
    }
});

server.post("/sign-in", async (req, res) => {
    const userSchema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().min(3).max(30).trim().required(),
    });

    try {
        const userValidation = await userSchema.validateAsync(req.body);

        const { email, password } = req.body;

        const emailValidation = await connection.query(`
            SELECT * FROM users
            WHERE email = $1
        `, [email]);

        const user = emailValidation.rows[0];

        if (user && bcrypt.compareSync(password, user.password)) {
            const token = uuid();

            await connection.query(`
                INSERT INTO sessions
                ("userId", token)
                VALUES ($1, $2)
            `, [user.id, token]);

            return res.send(token);
        } else {
            return res.sendStatus(404);
        }
    } catch(err) {
        if(
            err.message.includes("email")
            || err.message.includes("password")
        ) {
            console.log(err.message);
            return res.sendStatus(400);
        } else {
            console.log(err.message);
            return res.sendStatus(500);
        }
    }
});

server.listen(4000, () => {
    console.log("Server running on port 4000")
});