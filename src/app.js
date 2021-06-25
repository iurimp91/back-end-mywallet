import express from "express";
import cors from "cors";
import bcrypt from 'bcrypt';
import joi from "joi";
import { v4 as uuid } from "uuid";
import dayjs from "dayjs";
import connection from "./database.js";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/sign-up", async (req, res) => {
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

        if(emailValidation.rows.length !== 0) return res.sendStatus(409);

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

app.post("/sign-in", async (req, res) => {
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

            delete user.password;
            delete user.id;
            user.token = token;
            return res.send(user);
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

app.get("/cash-flow", async (req, res) => {
    try {
        const authorization = req.headers["authorization"];
        const token = authorization?.replace("Bearer ", "");

        if(!token) return res.sendStatus(401);
        
        const tokenValidation = await connection.query(`
            SELECT * FROM sessions
            JOIN users
            ON sessions."userId" = users.id
            WHERE sessions.token = $1
        `, [token]);
        
        const user = tokenValidation.rows[0];

        if(user) {  
            const result = await connection.query(`
                SELECT * FROM cash_flow
                WHERE "userId" = $1
                ORDER BY date DESC
            `, [user.userId]);

            result.rows.forEach(item => item.date = dayjs(item.date).format("DD/MM"));

            return res.send(result.rows);
        } else {
            return res.sendStatus(401);
        }
    } catch(err) {
        console.log(err);
        return res.sendStatus(500);
    }
});

app.post("/input", async (req, res) => {
    const inputSchema = joi.object({
        value: joi.number().integer().min(1).required(),
        description: joi.string().trim().min(3). max(30).required(),
        type: joi.string().valid('expense').valid('income').trim().required()
    });
    
    try {
        const inputValidation = await inputSchema.validateAsync(req.body);

        const { value, description, type } = req.body;

        const authorization = req.headers["authorization"];
        const token = authorization?.replace("Bearer ", "");
        
        if(!token) return res.sendStatus(401);
        
        const tokenValidation = await connection.query(`
            SELECT * FROM sessions
            JOIN users
            ON sessions."userId" = users.id
            WHERE sessions.token = $1
        `, [token]);

        const user = tokenValidation.rows[0];

        if(user) {
            const date = dayjs().format("DD-MM-YYYY HH:mm:ss");

            const result = connection.query(`
                INSERT INTO cash_flow
                ("userId", date, description, value, type)
                VALUES ($1, $2, $3, $4, $5)
            `, [user.userId, date, description, value, type]);

            return res.sendStatus(200);
        } else {
            return res.sendStatus(401);
        }
    } catch(err) {
        if(
            err.message.includes("value")
            || err.message.includes("description")
            || err.message.includes("type")
        ) {
            console.log(err.message);
            return res.sendStatus(400);
        } else {
            console.log(err.message);
            return res.sendStatus(500);
        }
    }
});

app.post("/sign-out", async (req, res) => {
    try {
        const authorization = req.headers["authorization"];
        const token = authorization.replace("Bearer ", "");

        if(!token) return res.sendStatus(401);

        const tokenValidation = await connection.query(`
            SELECT * FROM sessions
            JOIN users
            ON sessions."userId" = users.id
            WHERE sessions.token = $1 
        `, [token]);

        const user = tokenValidation.rows[0];

        if (user) {
            await connection.query(`
                DELETE FROM sessions
                WHERE "userId" = $1
            `, [user.userId]);

            return res.sendStatus(200);
        } else {
            return res.sendStatus(401);
        }
    } catch(err) {
        console.log(err.message);
        return res.sendStatus(500);
    }
});

app.get("/banana", (req, res) => {
    res.sendStatus(200);
});

export default app;