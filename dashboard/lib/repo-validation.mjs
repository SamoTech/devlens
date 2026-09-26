const OWNER_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9_.-]*[A-Za-z0-9])?$/
const REPO_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9_.-]*[A-Za-z0-9])?$/

/** Parse only a canonical GitHub repository slug or repository-root HTTPS URL. */
export function parseRepoSlug(input) {
  if (typeof input !== 'string') return null
  const value = input.trim()
  if (!value || value.length > 200 || /[\u0000-\u001f\u007f]/.test(value)) return null

  let path = value
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value)
      if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== 'github.com') return null
      if (url.username || url.password || url.search || url.hash) return null
      path = url.pathname
    } catch { return null }
  } else if (value.includes('://') || value.startsWith('//')) {
    return null
  }

  path = path.replace(/^\/+|\/+$/g, '')
  const parts = path.split('/')
  if (parts.length !== 2) return null
  const [owner, name] = parts
  if (!OWNER_PATTERN.test(owner) || !REPO_PATTERN.test(name)) return null
  if (owner.length > 39 || name.length > 100) return null
  return { owner, name, slug: `${owner}/${name}` }
}

export function repoInputError() {
  return 'Invalid repository. Use owner/name or the repository root URL https://github.com/owner/name.'
}
