import { tmpdir } from 'os'
import { join } from 'path'

const CADDY_FILE = process.env['CADDY_CONFIG'] ?? `${process.env['HOME']}/caddy/Caddyfile`

export async function readCaddy(): Promise<string> {
  try {
    return await Bun.file(CADDY_FILE).text()
  } catch {
    return ''
  }
}

export async function writeCaddy(content: string): Promise<void> {
  await Bun.write(CADDY_FILE, content)
  const proc = Bun.spawn(['caddy', 'reload', '--config', CADDY_FILE], { stdout: 'pipe', stderr: 'pipe' })
  await proc.exited
}

export async function validateCaddy(content: string): Promise<{ valid: boolean; error?: string }> {
  const tmp = join(tmpdir(), `caddyfile-validate-${Date.now()}`)
  await Bun.write(tmp, content)
  const proc = Bun.spawn(['caddy', 'validate', '--config', tmp], { stdout: 'pipe', stderr: 'pipe' })
  const stderr = await new Response(proc.stderr).text()
  const code = await proc.exited
  try { await Bun.file(tmp).arrayBuffer() } catch { /* ignore */ }
  if (code === 0) return { valid: true }
  return { valid: false, error: stderr.trim() }
}
