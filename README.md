# My Wallet API

An API to support the use of MyWallet financial manager (https://mywallet-front-ten.vercel.app/).

## About

This is an API that connects to a PostgreSQL database. Below are the implemented routes:

- Sign Up
- Sign In
- Sign Out
- Cash Flow (get the incomes and expenses of a user)
- Input (insert incomes or expenses of a user)

### Next Steps

Features and improvements that can be implemented:

- TypeScript
- TypeORM
- Layered architecture

## Technologies

The following tools and frameworks were used in the construction of the project:

- Node.js
- Express
- Cors
- Joi
- uuid
- Bcrypt
- PostgreSQL
- Jest (tests)
- Supertest (tests)

## How to run

1. Clone this repository
2. Clone the front-end repository at https://github.com/iurimp91/mywallet-front
3. Follow instructions to run front-end at https://github.com/iurimp91/mywallet-front
4. Install dependencies
```bash
npm i
```
5. Run the back-end with
```bash
npm run dev
```
6. You can optionally build the project running
```bash
npm run build
```
7. Finally access the front-end on your favorite browser (unless it is Internet Explorer. In this case, review your life decisions)
8. If you want to run the tests use
```bash
npm test
```
