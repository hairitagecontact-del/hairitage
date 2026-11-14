'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { CardType } from '@/types'
import { PASS_CONFIGS } from '@/lib/pass-config'

const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent)
const isAndroid = () => /Android/.test(navigator.userAgent)

const typeLabels: Record<CardType, { emoji: string; gradient: string }> = {
  homme:      { emoji: '✂', gradient: 'from-[#2C1810] to-[#5C3A1E]' },
  coiffure:   { emoji: '✿', gradient: 'from-[#2D1B2E] to-[#6B3F6B]' },
  esthetique: { emoji: '✦', gradient: 'from-[#1A0A10] to-[#8B2252]' },
}

export default function JoinPage() {
  const { type } = useParams() as { type: CardType }
  const router = useRouter()
  const config = PASS_CONFIGS[type]
  const ui = typeLabels[type]

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ apple_url?: string; google_url?: string } | null>(null)

  if (!config) {
    router.replace('/')
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/passes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, name: name.trim(), phone: phone.trim() }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      setResult(data)

      // Auto-redirect to Wallet on mobile
      if (isIOS() && data.apple_url) {
        window.location.href = data.apple_url
      } else if (isAndroid() && data.google_url) {
        window.location.href = data.google_url
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
        <div className="text-center max-w-sm w-full">
          <div className="text-5xl mb-6">🎉</div>
          <h2 className="text-2xl font-light mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Carte créée !
          </h2>
          <p className="text-[rgba(240,235,224,0.6)] text-sm mb-8">
            Ajoutez-la à votre téléphone
          </p>

          <div className="flex flex-col gap-3">
            {result.apple_url && (
              <a href={result.apple_url}
                className="flex items-center justify-center gap-3 bg-black text-white rounded-xl py-4 px-6 font-medium">
                <span>🍎</span> Ajouter à Apple Wallet
              </a>
            )}
            {result.google_url && (
              <a href={result.google_url}
                className="flex items-center justify-center gap-3 bg-[#1A73E8] text-white rounded-xl py-4 px-6 font-medium">
                <span>🤖</span> Ajouter à Google Wallet
              </a>
            )}
          </div>

          <p className="mt-8 text-[rgba(240,235,224,0.4)] text-xs">
            La carte reste dans votre téléphone, sans application.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        {/* Card preview */}
        <div className={`bg-gradient-to-br ${ui.gradient} rounded-2xl p-6 mb-8 text-white`}>
          <div className="text-xs tracking-widest uppercase text-[rgba(255,255,255,0.6)] mb-1">
            HAIR&apos;ITAGE
          </div>
          <div className="font-semibold text-lg">{config.label}</div>
          <div className="mt-4 flex gap-2">
            {Array.from({ length: config.totalStamps }).map((_, i) => (
              <div key={i} className="w-6 h-6 rounded-full border border-[rgba(255,255,255,0.35)]" />
            ))}
          </div>
          <div className="mt-3 text-xs text-[rgba(255,255,255,0.65)]">
            Cadeau : {config.gift}
          </div>
        </div>

        <h2 className="text-2xl font-light mb-1" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          Votre carte de fidélité
        </h2>
        <p className="text-[rgba(240,235,224,0.5)] text-sm mb-8">
          Renseignez vos informations pour recevoir votre carte.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold tracking-wider uppercase text-[rgba(240,235,224,0.5)] block mb-2">
              Votre prénom
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Karim"
              required
              className="w-full bg-[#1C1C18] border border-[rgba(201,168,76,0.2)] rounded-xl px-4 py-3 text-[#F0EBE0] placeholder-[rgba(240,235,224,0.3)] focus:outline-none focus:border-[#C9A84C]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold tracking-wider uppercase text-[rgba(240,235,224,0.5)] block mb-2">
              Numéro de téléphone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="06 XX XX XX XX"
              required
              className="w-full bg-[#1C1C18] border border-[rgba(201,168,76,0.2)] rounded-xl px-4 py-3 text-[#F0EBE0] placeholder-[rgba(240,235,224,0.3)] focus:outline-none focus:border-[#C9A84C]"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-[#C9A84C] text-[#0F0F0D] font-semibold rounded-full py-4 mt-2 disabled:opacity-60 transition-opacity"
          >
            {loading ? 'Création...' : 'Créer ma carte →'}
          </button>
        </form>
      </div>
    </main>
  )
}
