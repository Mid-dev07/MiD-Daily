import type { IncomingMessage } from 'node:http'

const DEFAULT_BODY_LIMIT = 64 * 1024

export async function readRequestBody(req: IncomingMessage, maxBytes = DEFAULT_BODY_LIMIT) {
  return new Promise<string>((resolve, reject) => {
    let body = ''
    let settled = false

    const fail = (error: Error) => {
      if (settled) return
      settled = true
      reject(error)
    }

    req.on('data', (chunk: Buffer | string) => {
      if (settled) return
      body += chunk.toString()

      if (body.length > maxBytes) {
        fail(new Error('Request body is too large.'))
        req.destroy()
      }
    })

    req.on('end', () => {
      if (!settled) {
        settled = true
        resolve(body)
      }
    })

    req.on('error', fail)
  })
}

export async function readRequestJson(req: IncomingMessage, maxBytes = DEFAULT_BODY_LIMIT) {
  const body = await readRequestBody(req, maxBytes)
  if (!body.trim()) return {}

  try {
    return JSON.parse(body) as Record<string, unknown>
  } catch {
    throw new Error('Request body must be valid JSON.')
  }
}
