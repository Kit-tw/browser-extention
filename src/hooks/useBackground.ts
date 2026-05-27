import { useState, useEffect } from 'react'
import { useSettingsStore } from '../store/settings.store'
import { getBlob } from '../services/backgroundDb'
import type { BackgroundSettings } from '../types/settings.types'

const DEFAULT_BG: BackgroundSettings = {
  enabled: false,
  entries: [],
  opacity: 0.4,
  blur: 0,
  fit: 'cover',
  todayKey: '',
  todayId: '',
}

export function useBackground() {
  const bg = useSettingsStore((s) => s.dashboard.background) ?? DEFAULT_BG
  const [blobUrl, setBlobUrl] = useState<string | null>(null)

  const { enabled, todayId, entries } = bg

  useEffect(() => {
    if (!enabled || !todayId) {
      setBlobUrl(null)
      return
    }
    const entry = entries.find((e) => e.id === todayId)
    if (!entry) {
      setBlobUrl(null)
      return
    }

    if (entry.type === 'url') {
      setBlobUrl(entry.url ?? null)
      return
    }

    // Local: load Blob from IndexedDB and create an object URL
    let objectUrl: string | null = null
    let cancelled = false

    getBlob(todayId)
      .then((blob) => {
        if (cancelled) return
        if (blob) {
          objectUrl = URL.createObjectURL(blob)
          setBlobUrl(objectUrl)
        } else {
          setBlobUrl(null)
        }
      })
      .catch(() => {
        if (!cancelled) setBlobUrl(null)
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [enabled, todayId]) // entries intentionally omitted: todayId is the stable key

  return { bg, blobUrl, hasBg: enabled && !!blobUrl }
}
