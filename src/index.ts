import { app } from './app.js'


const BACKEND_URL =
  process.env.NODE_ENV === "production"
    ? process.env.API_URL
    : `http://localhost:${process.env.PORT}`;
app.listen(3000, () => {
  console.log(`Servidor corriendo en ${BACKEND_URL}`)
})
