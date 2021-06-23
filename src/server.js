import express from "express";
import cors from "cors";
import pg from "pg";

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
    try {
        const { name, email, password } = req.body;
    } catch(err) {
        console.log(err);
        res.sendStatus(500);
    }
});

server.listen(4000, () => {
    console.log("Server running on port 4000")
});