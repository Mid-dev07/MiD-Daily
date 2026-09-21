export { buildAssistantTools, runAssistant } from './assistant.js'
export function isAssistantConfigured() {
  return Boolean(process.env.OPENAI_API_KEY)
}
