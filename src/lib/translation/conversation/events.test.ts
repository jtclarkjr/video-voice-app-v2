import { describe, expect, it } from 'vite-plus/test'
import {
  applyConversationEvent,
  createConversationRealtimeEventMapper,
  getConversationRealtimeEvent,
  isConversationErrorEvent
} from '$lib/translation/conversation/events'
import type { ConversationTurn } from '$lib/translation/types'

describe('translation conversation events', () => {
  it('extracts source transcript deltas', () => {
    expect(
      getConversationRealtimeEvent({
        delta: 'Hello',
        language: 'en',
        turnId: 'turn-1',
        type: 'conversation.transcript.delta'
      })
    ).toEqual({
      delta: 'Hello',
      language: 'en',
      turnId: 'turn-1',
      type: 'conversation.transcript.delta'
    })
  })

  it('extracts translated text deltas', () => {
    expect(
      getConversationRealtimeEvent({
        delta: 'こんにちは',
        sourceLanguage: 'en',
        targetLanguage: 'ja',
        turnId: 'turn-1',
        type: 'conversation.translation.delta'
      })
    ).toEqual({
      delta: 'こんにちは',
      sourceLanguage: 'en',
      targetLanguage: 'ja',
      turnId: 'turn-1',
      type: 'conversation.translation.delta'
    })
  })

  it('extracts completed turns', () => {
    expect(
      getConversationRealtimeEvent({
        turnId: 'turn-1',
        type: 'conversation.turn.completed'
      })
    ).toEqual({
      turnId: 'turn-1',
      type: 'conversation.turn.completed'
    })
  })

  it('ignores malformed and unrelated events', () => {
    expect(
      getConversationRealtimeEvent({
        delta: 'Hello',
        language: 'xx',
        turnId: 'turn-1',
        type: 'conversation.transcript.delta'
      })
    ).toBeNull()
    expect(
      getConversationRealtimeEvent({
        delta: 'Hello',
        type: 'session.output_transcript.delta'
      })
    ).toBeNull()
  })

  it('detects backend error events', () => {
    expect(isConversationErrorEvent({ type: 'error' })).toBe(true)
    expect(
      isConversationErrorEvent({ type: 'conversation.turn.completed' })
    ).toBe(false)
  })

  it('builds and completes chat turns from conversation deltas', () => {
    let turns: ConversationTurn[] = []

    turns = applyConversationEvent(
      turns,
      {
        delta: 'Hello',
        language: 'en',
        turnId: 'turn-1',
        type: 'conversation.transcript.delta'
      },
      ['en', 'ja']
    )
    turns = applyConversationEvent(
      turns,
      {
        delta: ' there',
        language: 'en',
        turnId: 'turn-1',
        type: 'conversation.transcript.delta'
      },
      ['en', 'ja']
    )
    turns = applyConversationEvent(
      turns,
      {
        delta: 'こんにちは',
        sourceLanguage: 'en',
        targetLanguage: 'ja',
        turnId: 'turn-1',
        type: 'conversation.translation.delta'
      },
      ['en', 'ja']
    )
    turns = applyConversationEvent(
      turns,
      {
        turnId: 'turn-1',
        type: 'conversation.turn.completed'
      },
      ['en', 'ja']
    )

    expect(turns).toEqual([
      {
        completed: true,
        id: 'turn-1',
        sourceText: 'Hello there',
        speakerLanguage: 'en',
        targetLanguage: 'ja',
        translatedText: 'こんにちは'
      }
    ])
  })

  it('maps native OpenAI translation events into a conversation turn', () => {
    const mapEvent = createConversationRealtimeEventMapper(['en', 'ja'])

    expect(
      mapEvent({
        delta: 'Hello',
        type: 'session.input_transcript.delta'
      })
    ).toEqual({
      delta: 'Hello',
      language: 'en',
      turnId: 'openai-turn-1',
      type: 'conversation.transcript.delta'
    })
    expect(
      mapEvent({
        delta: 'こんにちは',
        type: 'session.output_transcript.delta'
      })
    ).toEqual({
      delta: 'こんにちは',
      sourceLanguage: 'en',
      targetLanguage: 'ja',
      turnId: 'openai-turn-1',
      type: 'conversation.translation.delta'
    })
    expect(
      mapEvent({
        type: 'session.output_transcript.completed'
      })
    ).toEqual({
      turnId: 'openai-turn-1',
      type: 'conversation.turn.completed'
    })
  })
})
