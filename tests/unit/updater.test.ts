import { describe, it, expect } from 'vitest'

function parseVersion(v: string): [number, number, number] {
  const cleaned = v.replace(/^v/i, '').trim()
  const buildMatch = cleaned.match(/build-(\d+)/i) || cleaned.match(/build\s*#?(\d+)/i)
  if (buildMatch) {
    return [1, 0, parseInt(buildMatch[1], 10) || 0]
  }
  const parts = cleaned.split('.').map((p) => parseInt(p, 10) || 0)
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0]
}

function isNewer(current: string, remote: string): boolean {
  const [cMajor, cMinor, cPatch] = parseVersion(current)
  const [rMajor, rMinor, rPatch] = parseVersion(remote)

  if (rMajor !== cMajor) return rMajor > cMajor
  if (rMinor !== cMinor) return rMinor > cMinor
  return rPatch > cPatch
}

function formatBuildVersion(pkgVersion: string, runNumber?: string, gitSha?: string): {
  version: string
  displayVersion: string
  buildInfo: string
  fullVersionDisplay: string
} {
  const parts = pkgVersion.split('.')
  const majorMinor = `${parts[0] || '1'}.${parts[1] || '0'}`
  const version = runNumber ? `${majorMinor}.${runNumber}` : pkgVersion
  const displayVersion = `v${version}`
  const buildInfo = runNumber
    ? `Build #${runNumber}${gitSha ? ` (${gitSha})` : ''}`
    : 'Development Build'
  const fullVersionDisplay = `${displayVersion} • ${buildInfo} • Modern Markdown & Mermaid Editor`

  return { version, displayVersion, buildInfo, fullVersionDisplay }
}

describe('GitHub Build Number Versioning', () => {
  it('formats version as v1.0.33 for GitHub build 33', () => {
    const res = formatBuildVersion('1.0.0', '33', '4eabcc6')
    expect(res.version).toBe('1.0.33')
    expect(res.displayVersion).toBe('v1.0.33')
    expect(res.buildInfo).toBe('Build #33 (4eabcc6)')
    expect(res.fullVersionDisplay).toBe(
      'v1.0.33 • Build #33 (4eabcc6) • Modern Markdown & Mermaid Editor'
    )
  })

  it('falls back to package version in local development without run number', () => {
    const res = formatBuildVersion('1.0.0')
    expect(res.version).toBe('1.0.0')
    expect(res.displayVersion).toBe('v1.0.0')
    expect(res.buildInfo).toBe('Development Build')
    expect(res.fullVersionDisplay).toBe(
      'v1.0.0 • Development Build • Modern Markdown & Mermaid Editor'
    )
  })
})

describe('Update Version Comparison', () => {
  it('detects newer version by build number (v1.0.34 is newer than v1.0.33)', () => {
    expect(isNewer('v1.0.33', 'v1.0.34')).toBe(true)
  })

  it('detects current version is up to date (v1.0.33 is not newer than v1.0.33)', () => {
    expect(isNewer('v1.0.33', 'v1.0.33')).toBe(false)
  })

  it('detects older version is not newer (v1.0.32 is not newer than v1.0.33)', () => {
    expect(isNewer('v1.0.33', 'v1.0.32')).toBe(false)
  })

  it('handles semantic versions (v1.1.0 is newer than v1.0.33)', () => {
    expect(isNewer('v1.0.33', 'v1.1.0')).toBe(true)
    expect(isNewer('v1.0.33', 'v2.0.0')).toBe(true)
  })

  it('handles build-X tag format', () => {
    expect(isNewer('v1.0.33', 'v1.0.0-build-34')).toBe(true)
    expect(isNewer('v1.0.34', 'v1.0.0-build-33')).toBe(false)
  })
})
