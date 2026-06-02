import PocketBase from 'pocketbase'

const PB_URL_KEY = 'pb_url'

export function getPbUrl(): string {
  return localStorage.getItem(PB_URL_KEY) ?? 'http://galaxy-f14-5g.lan:8080'
}

export function setPbUrl(url: string) {
  localStorage.setItem(PB_URL_KEY, url)
}

// Singleton — recreated when URL changes
let _pb: PocketBase | null = null
let _pbUrl = ''

export function getPb(): PocketBase {
  const url = getPbUrl()
  if (!_pb || _pbUrl !== url) {
    _pb = new PocketBase(url)
    _pbUrl = url
  }
  return _pb
}
