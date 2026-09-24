import test from 'node:test'
import assert from 'node:assert/strict'
import {
  configureAssistantRuntime,
  executeAssistantProposals,
  runAssistant,
} from '../dist/ai/assistant.js'

test('AI preview returns write proposals without executing them', async () => {
  const responses = [
    {
      choices: [{
        message: {
          tool_calls: [{
            id: 'call_1',
            function: {
              name: 'create_task',
              arguments: JSON.stringify({
                title: 'Finish report',
                category: 'Study',
                priority: 'high',
                dueDate: '2026-09-30',
              }),
            },
          }],
        },
      }],
    },
    {
      choices: [{
        message: {
          content: 'I would create the task after you confirm.',
        },
      }],
    },
  ]

  configureAssistantRuntime({
    run: async () => responses.shift(),
  })

  const result = await runAssistant(
    'user-1',
    [{ role: 'user', content: 'Create a high priority study task called Finish report.' }],
    true,
    'preview',
  )

  assert.equal(result.proposals.length, 1)
  assert.equal(result.proposals[0].tool, 'create_task')
  assert.equal(result.actions[0].preview, true)

  configureAssistantRuntime(null)
})

test('AI proposal executor rejects read-only tools', async () => {
  await assert.rejects(
    () => executeAssistantProposals('user-1', [{ tool: 'get_open_tasks', arguments: {} }]),
    /read-only tool/i,
  )
})
