const API = 'http://localhost:3001'

export interface Asset {
  id: string
  userId: string
  type: 'TOKEN' | 'MAP' | 'SCENE'
  name: string
  filename: string
  url: string
  size: number
  createdAt: string
}

function authHeader(): Record<string, string> {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const assetsApi = {
  async listTokens(): Promise<Asset[]> {
    const res = await fetch(`${API}/assets/tokens`, {
      headers: authHeader(),
    })
    if (!res.ok) throw new Error('Не удалось загрузить токены')
    return res.json()
  },

  async uploadToken(file: File, name?: string): Promise<Asset> {
    const formData = new FormData()
    formData.append('file', file)
    if (name) formData.append('name', name)

    const res = await fetch(`${API}/assets/tokens/upload`, {
      method: 'POST',
      headers: authHeader(),
      body: formData,
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({ message: 'Ошибка загрузки' }))
      throw new Error(data.message || 'Ошибка загрузки')
    }
    return res.json()
  },

  async deleteAsset(id: string): Promise<void> {
    const res = await fetch(`${API}/assets/${id}`, {
      method: 'DELETE',
      headers: authHeader(),
    })
    if (!res.ok) throw new Error('Не удалось удалить')
  },

  // Полный URL для отображения
  getAssetUrl(asset: Asset): string {
    return `${API}${asset.url}`
  },
}