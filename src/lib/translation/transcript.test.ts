import { describe, expect, it } from 'vite-plus/test'
import {
  applyTranslationEvent,
  getTranslationDelta
} from '$lib/translation/transcript'

describe('translation transcript events', () => {
  it('extracts translated transcript deltas', () => {
    expect(
      getTranslationDelta({
        type: 'session.output_transcript.delta',
        delta: 'Hola'
      })
    ).toBe('Hola')
  })

  it('ignores unrelated realtime events', () => {
    expect(
      applyTranslationEvent('Hola', {
        type: 'session.input_transcript.delta',
        delta: 'Hello'
      })
    ).toBe('Hola')
  })

  it('appends translated deltas to the current transcript', () => {
    expect(
      applyTranslationEvent('Hola', {
        type: 'session.output_transcript.delta',
        delta: ' mundo'
      })
    ).toBe('Hola mundo')
  })
})
