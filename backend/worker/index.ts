import { httpServerHandler } from 'cloudflare:node'

// Importing the existing server keeps the backend routes and business logic intact.
// Cloudflare's Node HTTP compatibility layer bridges the Node server to Worker requests.
import '../src/server.js'

export default httpServerHandler({ port: 8787 })
