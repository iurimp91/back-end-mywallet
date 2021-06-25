import supertest from "supertest";
import app from "../src/app.js";
import connection from "../src/database.js";

beforeEach(async () => {
    await connection.query(`DELETE FROM users`);
    await connection.query(`DELETE FROM cash_flow`);
});

afterAll(async () => {
    await connection.query(`DELETE FROM users`);
    connection.end();
});

describe("GET /cash-flow", () => {
    it("returns status 401 for invalid user token", async () => {
        const newUser = { name: "Test", email: "test@test.com", password: "test" };
        const firstTry = await supertest(app).post("/sign-up").send(newUser);
        expect(firstTry.status).toEqual(201);

        const userLogin = { email: "test@test.com", password: "test" };
        const secondTry = await supertest(app).post("/sign-in").send(userLogin);
        expect(secondTry.status).toEqual(200);

        const token = ``;
       
        const result = await supertest(app).get("/cash-flow").set("Authorization", token);
        const status = result.status;

        expect(status).toEqual(401);
    });

    it("returns array of objects for valid user token", async () => {
        const newUser = { name: "Test", email: "test@test.com", password: "test" };
        const firstTry = await supertest(app).post("/sign-up").send(newUser);
        expect(firstTry.status).toEqual(201);

        const userLogin = { email: "test@test.com", password: "test" };
        const secondTry = await supertest(app).post("/sign-in").send(userLogin);
        expect(secondTry.status).toEqual(200);

        const user = await connection.query(`
            SELECT * FROM users
        `,);

        const userId = user.rows[0].id;

        await connection.query(`
            INSERT INTO cash_flow
            ("userId", date, description, value, type)
            VALUES
            ($1, '20-06-2021 14:00:00', 'Test 1', 100, 'income'),
            ($1, '21-06-2021 14:00:00', 'Test 2', 200, 'expense')
        `, [userId]);

        const token = `Bearer ${secondTry.body.token}`;
       
        const result = await supertest(app).get("/cash-flow").set("Authorization", token);

        expect(result.body).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    date: expect.any(String),
                    description: expect.any(String),
                    id: expect.any(Number),
                    type: 'expense' || 'income',
                    userId: userId,
                    value: expect.any(Number),
                })
            ])
        );
    });
});

describe("POST /sign-up", () => {
    it("returns status 409 for already existing email", async () => {
        const newUser = { name: "Test", email: "test@test.com", password: "test" };
        const firstTry = await supertest(app).post("/sign-up").send(newUser);
        expect(firstTry.status).toEqual(201);

        const secondTry = await supertest(app).post("/sign-up").send(newUser);
        expect(secondTry.status).toEqual(409);
    });

    it("returns status 201 for successful sign up", async () => {
        const newUser = { name: "Test", email: "test@test.com", password: "test" };
        const firstTry = await supertest(app).post("/sign-up").send(newUser);
        expect(firstTry.status).toEqual(201);
    })
});