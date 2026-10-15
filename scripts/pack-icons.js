const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const buildDir = path.resolve(__dirname, '../build')
const pyScript = path.resolve(__dirname, 'generate-icons.py')

if (fs.existsSync(pyScript)) {
  try {
    console.log('Running scripts/generate-icons.py to build multi-resolution macOS/Windows/Linux icons...')
    execSync(`python3 "${pyScript}"`, { stdio: 'inherit' })
    process.exit(0)
  } catch (err) {
    console.warn('Python icon generation failed, falling back to direct packing:', err.message)
  }
}

// Fallback if python is not available
const pngPath = path.join(buildDir, 'icon.png')
if (!fs.existsSync(pngPath)) {
  console.error('Missing build/icon.png')
  process.exit(1)
}

const pngBuffer = fs.readFileSync(pngPath)

// Generate valid Windows ICO file embedding PNG
const icoHeader = Buffer.alloc(6)
icoHeader.writeUInt16LE(0, 0)
icoHeader.writeUInt16LE(1, 2)
icoHeader.writeUInt16LE(1, 4)

const icoEntry = Buffer.alloc(16)
icoEntry.writeUInt8(0, 0)
icoEntry.writeUInt8(0, 1)
icoEntry.writeUInt8(0, 2)
icoEntry.writeUInt8(0, 3)
icoEntry.writeUInt16LE(1, 4)
icoEntry.writeUInt16LE(32, 6)
icoEntry.writeUInt32LE(pngBuffer.length, 8)
icoEntry.writeUInt32LE(22, 12)

const icoBuffer = Buffer.concat([icoHeader, icoEntry, pngBuffer])
fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuffer)

// Generate valid Apple ICNS file with ic10 (1024x1024)
const chunkLength = 8 + pngBuffer.length
const totalIcnsLength = 8 + chunkLength

const icnsHeader = Buffer.alloc(8)
icnsHeader.write('icns', 0, 4, 'ascii')
icnsHeader.writeUInt32BE(totalIcnsLength, 4)

const chunkHeader = Buffer.alloc(8)
chunkHeader.write('ic10', 0, 4, 'ascii')
chunkHeader.writeUInt32BE(chunkLength, 4)

const icnsBuffer = Buffer.concat([icnsHeader, chunkHeader, pngBuffer])
fs.writeFileSync(path.join(buildDir, 'icon.icns'), icnsBuffer)
console.log('Successfully generated build/icon.icns and build/icon.ico')
