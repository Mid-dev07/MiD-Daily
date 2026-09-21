import { server } from './server.js'

const PORT = Number(process.env.PORT ?? 8787)

server.listen(PORT, () => {
  console.log(`MiD-Daily backend listening on http://localhost:${PORT}`)
})
