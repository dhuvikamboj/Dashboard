const PB_URL = (process.env['POCKETBASE_URL'] ?? 'http://galaxy-f14-5g.lan:8080').replace(/\/$/, '')
const PB_EMAIL = process.env['POCKETBASE_EMAIL'] ?? ''
const PB_PASSWORD = process.env['POCKETBASE_PASSWORD'] ?? ''
const COLLECTION = 'dashboard_layout'

let adminToken: string | null = null
let tokenExpiry = 0

async function getAdminToken(): Promise<string | null> {
  if (!PB_EMAIL || !PB_PASSWORD) return null
  if (adminToken && Date.now() < tokenExpiry) return adminToken

  // PocketBase v0.21+ uses _superusers, older uses admins
  for (const endpoint of ['/api/collections/_superusers/auth-with-password', '/api/admins/auth-with-password']) {
    try {
      const res = await fetch(`${PB_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: PB_EMAIL, email: PB_EMAIL, password: PB_PASSWORD }),
      })
      if (res.ok) {
        const data = await res.json() as { token: string }
        adminToken = data.token
        tokenExpiry = Date.now() + 50 * 60 * 1000 // 50 min
        return adminToken
      }
    } catch { /* try next */ }
  }
  return null
}

async function ensureCollection(): Promise<void> {
  const token = await getAdminToken()
  if (!token) return // no admin creds, hope collection exists

  // Check if collection already exists
  const check = await fetch(`${PB_URL}/api/collections/${COLLECTION}`, {
    headers: { Authorization: token },
  })
  if (check.ok) return

  // Create it
  await fetch(`${PB_URL}/api/collections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: token },
    body: JSON.stringify({
      name: COLLECTION,
      type: 'base',
      fields: [
        { name: 'widgets', type: 'json', required: false },
      ],
      listRule: '',   // public read
      viewRule: '',
      createRule: '', // public write (internal use only — protect with DASHBOARD_TOKEN on Elysia)
      updateRule: '',
      deleteRule: '',
    }),
  })
}

// Run once on import
ensureCollection().catch(e => console.error('[pocketbase] ensureCollection:', e))

interface PBRecord {
  id: string
  widgets: unknown[]
}

async function listRecords(): Promise<PBRecord[]> {
  const res = await fetch(`${PB_URL}/api/collections/${COLLECTION}/records?page=1&perPage=1`)
  if (!res.ok) throw new Error(`PocketBase list failed: ${res.status} ${await res.text()}`)
  const json = await res.json() as { items?: PBRecord[]; totalItems?: number }
  return json.items ?? []
}

export async function readLayout(): Promise<unknown[]> {
  try {
    const records = await listRecords()
    if (records.length === 0) return []
    return Array.isArray(records[0]?.widgets) ? records[0].widgets : []
  } catch (e) {
    console.error('[pocketbase] readLayout error:', e)
    return []
  }
}

export async function writeLayout(widgets: unknown[]): Promise<void> {
  const records = await listRecords()
  if (records.length === 0) {
    const res = await fetch(`${PB_URL}/api/collections/${COLLECTION}/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ widgets }),
    })
    if (!res.ok) throw new Error(`PocketBase create failed: ${res.status} ${await res.text()}`)
  } else {
    const id = records[0]!.id
    const res = await fetch(`${PB_URL}/api/collections/${COLLECTION}/records/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ widgets }),
    })
    if (!res.ok) throw new Error(`PocketBase update failed: ${res.status} ${await res.text()}`)
  }
}
