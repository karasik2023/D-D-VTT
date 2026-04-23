import { useEffect } from 'react'
import { useAssetsStore } from '../stores/assetsStore'
import { assetsApi } from '../services/assetsApi'

export function useAssets() {
  const {
    tokens, loading, error,
    setTokens, addToken, removeToken, setLoading, setError,
  } = useAssetsStore()

  const fetchTokens = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await assetsApi.listTokens()
      setTokens(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  const uploadToken = async (file: File, name?: string) => {
    setLoading(true)
    setError(null)
    try {
      const asset = await assetsApi.uploadToken(file, name)
      addToken(asset)
      return asset
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки')
      throw e
    } finally {
      setLoading(false)
    }
  }

  const deleteToken = async (id: string) => {
    try {
      await assetsApi.deleteAsset(id)
      removeToken(id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления')
    }
  }

  useEffect(() => {
    fetchTokens()
  }, [])

  return {
    tokens,
    loading,
    error,
    uploadToken,
    deleteToken,
    refetch: fetchTokens,
    getAssetUrl: assetsApi.getAssetUrl,
  }
}