'use client'

import { useState, useEffect, useCallback } from 'react'
import { PASS_CONFIGS } from '@/lib/pass-config'
import type { CardType } from '@/types'

type Card = { id: string; type: CardType; stamps: number; updated_at: string }
type Customer = { id: string; name: string; phone: string; created_at: string; loyalty_cards: Card[] }

const TYPE_LABELS: Record<CardType, string> = {
  homme: 'Barbershop',
  coiffure: 'Coiffure',
  esthetique: 'Esthétique',
}

const TYPE_COLORS: Record<CardType, string> = {
  homme: 'bg-[#5C3A1E] text-[#F0EBE0]',
  coiffure: 'bg-[#6B3F6B] text-[#F0EBE0]',
  esthetique: 'bg-[#8B2252] text-[#F0EBE0]',
}

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function exportCSV(customers: Customer[]) {
  const rows = [['Nom', 'Téléphone', 'Type de carte', 'Tampons', 'Dernière visite', 'Inscription']]
  for (const c of customers) {
    for (const card of c.loyalty_cards) {
      const cfg = PASS_CONFIGS[card.type]
      rows.push([
        c.name,
        c.phone,
        TYPE_LABELS[card.type],
        `${card.stamps}/${cfg.totalStamps}`,
        new Date(card.updated_at).toLocaleDateString('fr-FR'),
        new Date(c.created_at).toLocaleDateString('fr-FR'),
      ])
    }
    if (c.loyalty_cards.length === 0) {
      rows.push([c.name, c.phone, '—', '—', '—', new Date(c.created_at).toLocaleDateString('fr-FR')])
    }
  }
  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `hairitage-clients-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function DashboardPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<CardType | 'all'>('all')
  const [filterActivity, setFilterActivity] = useState<'all' | 'active' | 'inactive'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/dashboard/customers')
      .then(r => r.json())
      .then(d => { setCustomers(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = customers.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
    const matchType = filterType === 'all' || c.loyalty_cards.some(card => card.type === filterType)
    const matchActivity = filterActivity === 'all' ||
      (filterActivity === 'active' && c.loyalty_cards.some(card => daysSince(card.updated_at) <= 15)) ||
      (filterActivity === 'inactive' && c.loyalty_cards.every(card => daysSince(card.updated_at) > 15))
    return matchSearch && matchType && matchActivity
  })

  const stats = {
    total: customers.length,
    active: customers.filter(c => c.loyalty_cards.some(card => daysSince(card.updated_at) <= 15)).length,
    giftsReady: customers.filter(c => c.loyalty_cards.some(card => card.stamps >= PASS_CONFIGS[card.type].totalStamps)).length,
  }

  return (
    <main className="min-h-screen px-4 py-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-[#C9A84C] tracking-widest text-xs uppercase mb-2">HAIR&apos;ITAGE</div>
        <h1 className="text-3xl font-light" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          Tableau de bord
        </h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Clients', value: stats.total },
          { label: 'Actifs (15j)', value: stats.active, accent: true },
          { label: 'Cadeaux prêts', value: stats.giftsReady, gold: true },
        ].map(({ label, value, accent, gold }) => (
          <div key={label} className="bg-[#1C1C18] border border-[rgba(201,168,76,0.12)] rounded-2xl p-4 text-center">
            <div className={`text-2xl font-semibold mb-1 ${gold ? 'text-[#C9A84C]' : accent ? 'text-green-400' : 'text-[#F0EBE0]'}`}>
              {value}
            </div>
            <div className="text-xs text-[rgba(240,235,224,0.5)] uppercase tracking-wide">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters + Export */}
      <div className="flex flex-col gap-3 mb-6">
        <input
          type="text"
          placeholder="Rechercher un client..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-[#1C1C18] border border-[rgba(201,168,76,0.2)] rounded-xl px-4 py-3 text-[#F0EBE0] placeholder-[rgba(240,235,224,0.3)] focus:outline-none focus:border-[#C9A84C]"
        />
        <div className="flex gap-2 flex-wrap">
          {(['all', 'homme', 'coiffure', 'esthetique'] as const).map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filterType === t ? 'bg-[#C9A84C] text-[#0F0F0D]' : 'bg-[#1C1C18] border border-[rgba(201,168,76,0.2)] text-[rgba(240,235,224,0.6)]'
              }`}>
              {t === 'all' ? 'Tous' : TYPE_LABELS[t]}
            </button>
          ))}
          <div className="flex-1" />
          {(['all', 'active', 'inactive'] as const).map(a => (
            <button key={a} onClick={() => setFilterActivity(a)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filterActivity === a ? 'bg-[#C9A84C] text-[#0F0F0D]' : 'bg-[#1C1C18] border border-[rgba(201,168,76,0.2)] text-[rgba(240,235,224,0.6)]'
              }`}>
              {a === 'all' ? 'Tous' : a === 'active' ? 'Actifs' : 'Inactifs'}
            </button>
          ))}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-[rgba(240,235,224,0.4)]">{filtered.length} client{filtered.length !== 1 ? 's' : ''}</span>
          <button onClick={() => exportCSV(customers)}
            className="text-xs text-[#C9A84C] border border-[rgba(201,168,76,0.3)] px-3 py-1.5 rounded-full hover:bg-[rgba(201,168,76,0.08)] transition-colors">
            ↓ Exporter CSV
          </button>
        </div>
      </div>

      {/* Client list */}
      {loading ? (
        <div className="text-center text-[rgba(240,235,224,0.4)] py-12">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-[rgba(240,235,224,0.4)] py-12">Aucun client trouvé</div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(c => (
            <div key={c.id} className="bg-[#1C1C18] border border-[rgba(201,168,76,0.12)] rounded-2xl overflow-hidden">
              <button className="w-full px-4 py-4 text-left" onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{c.name}</div>
                    <div className="text-sm text-[rgba(240,235,224,0.5)]">{c.phone}</div>
                  </div>
                  <div className="flex flex-col gap-1 items-end shrink-0">
                    {c.loyalty_cards.map(card => {
                      const cfg = PASS_CONFIGS[card.type]
                      const done = card.stamps >= cfg.totalStamps
                      return (
                        <span key={card.id} className={`text-xs px-2 py-0.5 rounded-full ${done ? 'bg-[rgba(201,168,76,0.2)] text-[#C9A84C]' : TYPE_COLORS[card.type]}`}>
                          {TYPE_LABELS[card.type]} {card.stamps}/{cfg.totalStamps}{done ? ' 🎁' : ''}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </button>

              {expanded === c.id && (
                <div className="border-t border-[rgba(201,168,76,0.08)] px-4 py-3">
                  {c.loyalty_cards.map(card => {
                    const cfg = PASS_CONFIGS[card.type]
                    return (
                      <div key={card.id} className="mb-3">
                        <div className="flex justify-between text-xs text-[rgba(240,235,224,0.5)] mb-1.5">
                          <span>{TYPE_LABELS[card.type]}</span>
                          <span>Dernière visite il y a {daysSince(card.updated_at)}j</span>
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          {Array.from({ length: cfg.totalStamps }).map((_, i) => (
                            <div key={i} className={`w-4 h-4 rounded-full border ${i < card.stamps ? 'bg-[#C9A84C] border-[#C9A84C]' : 'border-[rgba(255,255,255,0.2)]'}`} />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  <div className="text-xs text-[rgba(240,235,224,0.3)] mt-2">
                    Client depuis le {new Date(c.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
