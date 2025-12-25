#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const source = path.join(__dirname, '..', 'google-FlowerStore-2025-12-25.csv')
const target = path.join(__dirname, '..', 'data', 'shops.json')

function parseCsvLine(line) {
  const values = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  values.push(current.trim())
  return values
}

function deriveDistrict(address) {
  if (!address) return '板橋區'
  const match = /(板橋|新莊|中和|永和|三重|新店|土城|樹林)/.exec(address)
  return match ? `${match[1]}區` : '板橋區'
}

function transform() {
  if (!fs.existsSync(source)) {
    throw new Error('找不到來源 CSV：' + source)
  }

  const lines = fs.readFileSync(source, 'utf8').split(/\r?\n/).filter(Boolean)
  const headers = parseCsvLine(lines.shift())

  const rows = lines.map((line) => {
    const cols = parseCsvLine(line)
    const row = {}
    headers.forEach((header, idx) => {
      row[header] = cols[idx] || ''
    })
    return row
  })

  const cleaned = rows.map((row) => ({
    map_url: row['hfpxzc href'],
    name: row.qBF1Pd,
    rating: row['評分'],
    reviews: row['評分數'],
    address: row[''],
    phone: row.UsdlK,
    image_url: row['FQ2IWe src'],
    district: deriveDistrict(row[''])
  }))

  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, JSON.stringify(cleaned, null, 2), 'utf8')
  console.log(`轉換完成：${cleaned.length} 筆 ➜ ${path.relative(process.cwd(), target)}`)
}

transform()
