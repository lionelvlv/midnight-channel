// api/search.js — key rotation, optional year range + tag filters
const YT_SEARCH = 'https://www.googleapis.com/youtube/v3/search'

function getKeys() {
  const keys = []
  for (let i = 1; i <= 10; i++) {
    const k = process.env[`YOUTUBE_API_KEY_${i}`]
    if (k) keys.push(k)
  }
  if (process.env.YOUTUBE_API_KEY) keys.push(process.env.YOUTUBE_API_KEY)
  return keys
}

async function searchWithKey(key, q, order, publishedAfter, publishedBefore) {
  const params = new URLSearchParams({
    part: 'snippet', q, type: 'video', maxResults: 20,
    order: order || 'relevance', key,
  })
  if (publishedAfter)  params.set('publishedAfter',  publishedAfter)
  if (publishedBefore) params.set('publishedBefore', publishedBefore)
  const res  = await fetch(`${YT_SEARCH}?${params}`)
  const data = await res.json()
  return { status: res.status, data }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  const { q, order, publishedAfter, publishedBefore } = req.query
  if (!q) return res.status(400).json({ error: 'Missing q' })
  const keys = getKeys()
  if (!keys.length) return res.status(500).json({ error: 'No API keys configured' })
  for (let i = 0; i < keys.length; i++) {
    try {
      const { status, data } = await searchWithKey(keys[i], q, order, publishedAfter, publishedBefore)
      if (status === 403 && data?.error?.errors?.[0]?.reason === 'quotaExceeded') { continue }
      if (!status.toString().startsWith('2')) return res.status(status).json(data)
      return res.status(200).json(data)
    } catch (err) { console.error(`Key ${i+1} error:`, err.message); continue }
  }
  return res.status(429).json({ error: 'All API keys exhausted.' })
}
