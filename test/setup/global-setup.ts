import dotenv from "dotenv";
import path from "path";

export function setup() {
  dotenv.config({
    path: path.resolve(process.cwd(), ".env.test"),
    override: true,
  });
}