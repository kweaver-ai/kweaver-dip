import fs from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { iconSources, type IconSourceConfig } from './config'

export interface ExtractedSymbol {
  id: string
  viewBox: string
  content: string
}

export function extractSymbols(jsContent: string): ExtractedSymbol[] {
  const svgMatch = jsContent.match(/['"`](<svg[\s\S]+?<\/svg>)['"`]/)

  if (!svgMatch) {
    throw new Error('Failed to locate SVG payload in iconfont script')
  }

  const svgMarkup = svgMatch[1]
    .replace(/\\n/g, '')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")

  const symbols: ExtractedSymbol[] = []
  const symbolPattern = /<symbol\s([^>]*)>([\s\S]*?)<\/symbol>/g

  let match: RegExpExecArray | null

  while ((match = symbolPattern.exec(svgMarkup)) !== null) {
    const attrs = match[1]
    const content = match[2].trim()
    const idMatch = attrs.match(/id=["']([^"']+)["']/)

    if (!idMatch) {
      continue
    }

    const viewBoxMatch = attrs.match(/viewBox=["']([^"']+)["']/)

    symbols.push({
      id: idMatch[1],
      viewBox: viewBoxMatch?.[1] ?? '0 0 1024 1024',
      content,
    })
  }

  if (symbols.length === 0) {
    throw new Error('No <symbol> elements were extracted from iconfont script')
  }

  return symbols
}

export function wrapSymbolAsSvg(symbol: ExtractedSymbol): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${symbol.viewBox}">${symbol.content}</svg>`
}

export function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https://') ? https : http

    client
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode} while requesting ${url}`))
          return
        }

        let body = ''
        response.setEncoding('utf8')
        response.on('data', (chunk) => {
          body += chunk
        })
        response.on('end', () => resolve(body))
      })
      .on('error', reject)
  })
}

export async function downloadIconSource(
  source: IconSourceConfig,
  rootDir = process.cwd(),
): Promise<number> {
  const body = await fetchText(source.symbolUrl)
  const symbols = extractSymbols(body)
  const outputDir = path.resolve(rootDir, source.rawDir)

  fs.rmSync(outputDir, { recursive: true, force: true })
  fs.mkdirSync(outputDir, { recursive: true })

  // 用大小写不敏感的 Set 避免 Windows 上 icon-A.svg 覆盖 icon-a.svg
  const writtenPaths = new Set<string>()
  let writtenCount = 0

  for (const symbol of symbols) {
    const baseId = symbol.id
    let candidate = `${baseId}.svg`
    let suffix = 2
    while (writtenPaths.has(candidate.toLowerCase())) {
      candidate = `${baseId}-${suffix}.svg`
      suffix += 1
    }
    writtenPaths.add(candidate.toLowerCase())
    const filePath = path.join(outputDir, candidate)
    fs.writeFileSync(filePath, wrapSymbolAsSvg(symbol), 'utf8')
    writtenCount += 1
  }

  return writtenCount
}

export async function runDownload(rootDir = process.cwd()): Promise<void> {
  for (const source of iconSources) {
    const count = await downloadIconSource(source, rootDir)
    console.log(`downloaded ${count} ${source.kind} icons to ${source.rawDir}`)
  }
}

const isDirectExecution =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href

if (isDirectExecution) {
  runDownload().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
