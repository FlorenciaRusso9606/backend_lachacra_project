import dotenv from "dotenv";

dotenv.config({
  path: ".env.test",
});
console.log("DB:", process.env.DATABASE_URL);