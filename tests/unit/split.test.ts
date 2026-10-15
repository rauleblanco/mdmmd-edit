import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '../../src/stores/appStore'

describe('Split Ratio and Layout Store', () => {
  beforeEach(() => {
    useAppStore.getState().resetSplitRatio()
  })

  it('defaults to 0.5 (50/50 split)', () => {
    expect(useAppStore.getState().splitRatio).toBe(0.5)
  })

  it('updates splitRatio within allowed bounds', () => {
    useAppStore.getState().setSplitRatio(0.65)
    expect(useAppStore.getState().splitRatio).toBe(0.65)
  })

  it('clamps splitRatio to min (0.15) and max (0.85) bounds', () => {
    useAppStore.getState().setSplitRatio(0.05)
    expect(useAppStore.getState().splitRatio).toBe(0.15)

    useAppStore.getState().setSplitRatio(0.95)
    expect(useAppStore.getState().splitRatio).toBe(0.85)
  })

  it('resets splitRatio back to 0.5', () => {
    useAppStore.getState().setSplitRatio(0.7)
    expect(useAppStore.getState().splitRatio).toBe(0.7)

    useAppStore.getState().resetSplitRatio()
    expect(useAppStore.getState().splitRatio).toBe(0.5)
  })
})
