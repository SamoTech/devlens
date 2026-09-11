function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export function scoreColor(score) {
  if (score >= 80) return '4c9a2a'
  if (score >= 60) return 'e6a817'
  if (score >= 40) return 'd97706'
  return 'dc2626'
}

export function buildBadgeSvg(score, label = 'DevLens') {
  const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0
  const safeLabel = escapeXml(label)
  const value = `${safeScore}/100`
  const color = scoreColor(safeScore)
  const lw = 68
  const vw = 52
  const tw = lw + vw

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tw}" height="20" role="img" aria-label="${safeLabel}: ${value}">
  <title>${safeLabel}: ${value}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${tw}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${lw}" height="20" fill="#555"/>
    <rect x="${lw}" width="${vw}" height="20" fill="#${color}"/>
    <rect width="${tw}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="110">
    <text x="${Math.round(lw / 2) * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(lw - 10) * 10}" lengthAdjust="spacing">${safeLabel}</text>
    <text x="${Math.round(lw / 2) * 10}" y="140" transform="scale(.1)" textLength="${(lw - 10) * 10}" lengthAdjust="spacing">${safeLabel}</text>
    <text x="${(lw + Math.round(vw / 2)) * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(vw - 10) * 10}" lengthAdjust="spacing">${value}</text>
    <text x="${(lw + Math.round(vw / 2)) * 10}" y="140" transform="scale(.1)" textLength="${(vw - 10) * 10}" lengthAdjust="spacing">${value}</text>
  </g>
</svg>`
}
