import React, { useState, useRef } from 'react'
import { useSettings } from '../../hooks/useSettings'
import { saveBlob, deleteBlob, resizeImageToBlob } from '../../services/backgroundDb'
import type { BgEntry, BgFit } from '../../types/settings.types'

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
        checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

export function BackgroundSettings() {
  const { dashboard, updateBackground, addBgEntry, removeBgEntry } = useSettings()
  const bg = dashboard.background
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [urlInput, setUrlInput] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    setError(null)
    try {
      for (const file of Array.from(files)) {
        const blob = await resizeImageToBlob(file)
        const id = generateId()
        await saveBlob(id, blob)
        await addBgEntry({ id, type: 'local', name: file.name })
      }
    } catch {
      setError('Failed to upload image.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleAddUrl = async () => {
    const url = urlInput.trim()
    if (!url.startsWith('https://')) {
      setError('URL must start with https://')
      return
    }
    const id = generateId()
    await addBgEntry({ id, type: 'url', name: url, url })
    setUrlInput('')
    setShowUrlInput(false)
    setError(null)
  }

  const handleRemove = async (entry: BgEntry) => {
    if (entry.type === 'local') await deleteBlob(entry.id)
    await removeBgEntry(entry.id)
  }

  return (
    <div className="space-y-5">
      {/* Enable toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Background</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Rotates daily when multiple images are added
          </p>
        </div>
        <Toggle checked={bg.enabled} onChange={() => updateBackground({ enabled: !bg.enabled })} />
      </div>

      {/* Image collection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Images{bg.entries.length > 0 ? ` (${bg.entries.length})` : ''}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-xs px-2.5 py-1 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-40 transition-colors"
            >
              {uploading ? 'Uploading…' : '+ Local'}
            </button>
            <button
              onClick={() => { setShowUrlInput((v) => !v); setError(null) }}
              className="text-xs px-2.5 py-1 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              + URL
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* URL input */}
        {showUrlInput && (
          <div className="flex gap-2 mb-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddUrl() }}
              placeholder="https://example.com/image.jpg"
              className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddUrl}
              disabled={!urlInput.trim()}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              Add
            </button>
          </div>
        )}

        {error && <p className="text-xs text-red-500 dark:text-red-400 mb-2">{error}</p>}

        {bg.entries.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
            No images added yet.
          </p>
        ) : (
          <div className="space-y-1.5">
            {bg.entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-2.5 px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <span
                  className={`shrink-0 text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                    entry.type === 'local'
                      ? 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400'
                      : 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400'
                  }`}
                >
                  {entry.type === 'local' ? 'file' : 'url'}
                </span>
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
                  {entry.name}
                </span>
                <button
                  onClick={() => handleRemove(entry)}
                  className="shrink-0 text-xs text-red-500 dark:text-red-400 hover:underline"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Display options — only relevant when there are entries */}
      {bg.entries.length > 0 && (
        <div className="space-y-4 pt-3 border-t border-gray-100 dark:border-gray-800">
          {/* Dim / opacity */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Dim</label>
              <span className="text-xs tabular-nums text-gray-400 dark:text-gray-500">
                {Math.round(bg.opacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={80}
              value={Math.round(bg.opacity * 100)}
              onChange={(e) => updateBackground({ opacity: Number(e.target.value) / 100 })}
              className="w-full accent-blue-600"
            />
          </div>

          {/* Blur */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Blur</label>
              <span className="text-xs tabular-nums text-gray-400 dark:text-gray-500">
                {bg.blur}px
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              value={bg.blur}
              onChange={(e) => updateBackground({ blur: Number(e.target.value) })}
              className="w-full accent-blue-600"
            />
          </div>

          {/* Fit mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Fit
            </label>
            <div className="flex gap-2">
              {(['cover', 'contain', 'center'] as BgFit[]).map((fit) => (
                <button
                  key={fit}
                  onClick={() => updateBackground({ fit })}
                  className={`flex-1 py-1.5 text-xs rounded-lg capitalize transition-colors ${
                    bg.fit === fit
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {fit}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
