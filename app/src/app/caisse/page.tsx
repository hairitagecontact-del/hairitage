'use client'

import { useState, useEffect } from 'react'
import type { CardType } from '@/types'
import { PASS_CONFIGS } from '@/lib/pass-config'

type Customer = {
  id: string
  name: string
  phone: string
  loyalty_cards: Array<{ id: string; type: CardType; stamps: number; apple_pass_serial: string }>
}

export default function CaissePage() {
  const [pin, setPin] = useState('')
  const [authed, setAuthed] = useState(false)
  const [pinError, setPinError] = useState(false)

  // Check if already authed in session
  useEffect(() => {
    if (sessionStorage.getItem('caisse_auth') === 'ok') setAuthed(true)
  }, [])

  function submitPin(e: React.FormEvent) {
    e.preventDefault()
    // PIN is verified server-side — here we just store locally for UX
    // Real check happens on each API call via x-caisse-pin header
    if (pin.length === 4) {
      sessionStorage.setItem('caisse_pin', pin)
      sessionStorage.setItem('caisse_auth', 'ok')
      setAuthed(true)
    } else {
      setPinError(true)
    }
  }

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-xs text-center">
          <div className="text-[#C9A84C] tracking-widest text-sm uppercase mb-8">
            HAIR&apos;ITAGE — Caisse
          </div>
          <h2 className="text-2xl font-light mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Code PIN
          </h2>
          <form onSubmit={submitPin} className="flex flex-col gap-4">
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={e => { setPin(e.target.value); setPinError(false) }}
              placeholder="• • • •"
              className="text-center text-3xl tracking-[1em] bg-[#1C1C18] border border-[rgba(201,168,76,0.2)] rounded-xl px-4 py-4 text-[#F0EBE0] focus:outline-none focus:border-[#C9A84C]"
            />
            {pinError && <p className="text-red-400 text-sm">PIN incorrect</p>}
            <button type="submit" className="bg-[#C9A84C] text-[#0F0F0D] font-semibold rounded-full py-4">
              Entrer
            </button>
          </form>
        </div>
      </main>
    )
  }

  return <CaisseApp />
}

function CaisseApp() {
  const [query, setQuery] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selected, setSelected] = useState<Customer | null>(null)
  const [selectedType, setSelectedType] = useState<CardType | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ message: string; complete: boolean } | null>(null)

  const pin = typeof window !== 'undefined' ? sessionStorage.getItem('caisse_pin') ?? '' : ''

  async function search(q: string) {
    setQuery(q)
    if (q.length < 2) { setCustomers([]); return }
    const res = await fetch(`/api/customers?q=${encodeURIComponent(q)}`, {
      headers: { 'x-caisse-pin': pin }
    })
    const data = await res.json()
    setCustomers(data)
  }

  async function addStamp() {
    if (!selected || !selectedType) return
    const card = selected.loyalty_cards.find(c => c.type === selectedType)
    if (!card) return

    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/passes/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-caisse-pin': pin },
        body: JSON.stringify({ serial: card.apple_pass_serial, action: 'stamp' }),
      })
      const data = await res.json()
      setResult(data)
      // Refresh customer
      await search(query)
    } finally {
      setLoading(false)
    }
  }

  async function redeemGift() {
    if (!selected || !selectedType) return
    const card = selected.loyalty_cards.find(c => c.type === selectedType)
    if (!card) return

    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/passes/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-caisse-pin': pin },
        body: JSON.stringify({ serial: card.apple_pass_serial, action: 'redeem' }),
      })
      const data = await res.json()
      setResult({ ...data, message: '🎁 Cadeau encaissé — carte remise à zéro' })
      await search(query)
    } finally {
      setLoading(false)
    }
  }

  const activeCard = selected?.loyalty_cards.find(c => c.type === selectedType)
  const config = selectedType ? PASS_CONFIGS[selectedType] : null

  return (
    <main className="min-h-screen px-4 py-10 max-w-sm mx-auto">
      <div className="text-[#C9A84C] tracking-widest text-xs uppercase mb-8 text-center">
        HAIR&apos;ITAGE — Caisse
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={query}
          onChange={e => { search(e.target.value); setSelected(null); setResult(null) }}
          placeholder="Nom ou numéro de téléphone..."
          className="w-full bg-[#1C1C18] border border-[rgba(201,168,76,0.2)] rounded-xl px-4 py-3 text-[#F0EBE0] placeholder-[rgba(240,235,224,0.3)] focus:outline-none focus:border-[#C9A84C]"
        />
      </div>

      {/* Results */}
      {customers.length > 0 && !selected && (
        <div className="flex flex-col gap-2 mb-6">
          {customers.map(c => (
            <button key={c.id} onClick={() => { setSelected(c); setCustomers([]) }}
              className="bg-[#1C1C18] border border-[rgba(201,168,76,0.15)] rounded-xl px-4 py-3 text-left hover:border-[#C9A84C] transition-colors">
              <div className="font-medium">{c.name}</div>
              <div className="text-sm text-[rgba(240,235,224,0.5)]">{c.phone}</div>
            </button>
          ))}
        </div>
      )}

      {/* Selected customer */}
      {selected && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-semibold text-lg">{selected.name}</div>
              <div className="text-sm text-[rgba(240,235,224,0.5)]">{selected.phone}</div>
            </div>
            <button onClick={() => { setSelected(null); setSelectedType(null); setResult(null) }}
              className="text-[rgba(240,235,224,0.4)] text-sm">
              Changer
            </button>
          </div>

          {/* Card type selector */}
          <div className="flex flex-col gap-2 mb-6">
            {selected.loyalty_cards.map(card => {
              const cfg = PASS_CONFIGS[card.type]
              const isComplete = card.stamps >= cfg.totalStamps
              return (
                <button key={card.id}
                  onClick={() => { setSelectedType(card.type); setResult(null) }}
                  className={`rounded-xl px-4 py-3 text-left border transition-all ${
                    selectedType === card.type
                      ? 'border-[#C9A84C] bg-[rgba(201,168,76,0.08)]'
                      : 'border-[rgba(201,168,76,0.15)] bg-[#1C1C18]'
                  }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{cfg.label}</span>
                    {isComplete && <span className="text-xs bg-[rgba(201,168,76,0.2)] text-[#C9A84C] px-2 py-0.5 rounded-full">🎁 Cadeau prêt</span>}
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    {Array.from({ length: cfg.totalStamps }).map((_, i) => (
                      <div key={i} className={`w-5 h-5 rounded-full border ${
                        i < card.stamps ? 'bg-[#C9A84C] border-[#C9A84C]' : 'border-[rgba(255,255,255,0.3)]'
                      }`} />
                    ))}
                  </div>
                  <div className="text-xs text-[rgba(240,235,224,0.5)] mt-1">
                    {card.stamps}/{cfg.totalStamps} — {cfg.gift}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Action buttons */}
          {selectedType && activeCard && config && (
            <div className="flex flex-col gap-3">
              <button
                onClick={addStamp}
                disabled={loading || activeCard.stamps >= config.totalStamps}
                className="bg-[#C9A84C] text-[#0F0F0D] font-semibold rounded-full py-4 disabled:opacity-50 transition-opacity"
              >
                {loading ? '...' : '+ Ajouter un tampon'}
              </button>

              {activeCard.stamps >= config.totalStamps && (
                <button
                  onClick={redeemGift}
                  disabled={loading}
                  className="bg-[#1C1C18] border border-[#C9A84C] text-[#C9A84C] font-semibold rounded-full py-4 disabled:opacity-50"
                >
                  🎁 Encaisser le cadeau
                </button>
              )}

              {result && (
                <div className={`text-center py-3 rounded-xl text-sm font-medium ${
                  result.complete ? 'bg-[rgba(201,168,76,0.15)] text-[#C9A84C]' : 'bg-[rgba(76,175,125,0.1)] text-green-400'
                }`}>
                  {result.message}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  )
}
