/**
 * Keep only finite, non-negative weights for known dimensions. Invalid input
 * falls back to the supplied defaults instead of entering the score equation.
 */
export function sanitizeWeights(input, defaults) {
  const result = { ...defaults }
  if (!input || typeof input !== 'object' || Array.isArray(input)) return result

  for (const key of Object.keys(defaults)) {
    const value = Number(input[key])
    if (Number.isFinite(value) && value >= 0 && value <= 1) result[key] = value
  }

  const sum = Object.values(result).reduce((total, value) => total + value, 0)
  return Number.isFinite(sum) && sum > 0 ? result : { ...defaults }
}
