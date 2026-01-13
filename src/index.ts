import { app } from './app.js'
const PORT =  process.env.NODE_ENV === "production" ? :  8080

const BACKEND_URL =
  process.env.NODE_ENV === "production"
    ? process.env.API_URL
    : `http://localhost:${PORT}`;
app.listen(3000, () => {
  console.log(`Servidor corriendo en ${BACKEND_URL}`)
})
