import { getDashboardStats } from '@/lib/db'

export const revalidate = 60 // refresh every 60s

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <main className="min-h-screen px-4 py-10 max-w-lg mx-auto">
      <div className="text-center mb-10">
        <div className="text-[#C9A84C] tracking-widest text-xs uppercase mb-2">
          HAIR&apos;ITAGE
        </div>
        <h1 className="text-3xl font-light" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          Tableau de bord
        </h1>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <Tile label="Cartes actives" value={stats.totalCards} />
        <Tile label="Tampons ce mois" value={stats.stampsThisMonth} />
        <Tile label="Cadeaux donnés" value={stats.giftsGiven} accent />
        <Tile label="Clients inactifs" value={stats.inactive} warn={stats.inactive > 10} />
      </div>

      {/* By type */}
      <div className="bg-[#1C1C18] border border-[rgba(201,168,76,0.15)] rounded-2xl p-5 mb-6">
        <h2 className="text-xs font-semibold tracking-wider uppercase text-[rgba(240,235,224,0.5)] mb-4">
          Répartition par carte
        </h2>
        <div className="flex flex-col gap-3">
          {[
            { label: 'Barbershop', key: 'homme', color: 'bg-[#5C3A1E]' },
            { label: 'Coiffure', key: 'coiffure', color: 'bg-[#6B3F6B]' },
            { label: 'Esthétique', key: 'esthetique', color: 'bg-[#8B2252]' },
          ].map(({ label, key, color }) => {
            const count = stats.byType[key as keyof typeof stats.byType]
            const pct = stats.totalCards > 0 ? Math.round(count / stats.totalCards * 100) : 0
            return (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span>{label}</span>
                  <span className="text-[rgba(240,235,224,0.5)]">{count} clients</span>
                </div>
                <div className="h-2 bg-[#242420] rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Inactive alert */}
      {stats.inactive > 0 && (
        <div className="bg-[rgba(201,168,76,0.08)] border border-[rgba(201,168,76,0.25)] rounded-2xl p-5">
          <div className="text-[#C9A84C] font-semibold mb-1">
            {stats.inactive} client{stats.inactive > 1 ? 's' : ''} inactif{stats.inactive > 1 ? 's' : ''}
          </div>
          <p className="text-sm text-[rgba(240,235,224,0.6)]">
            Pas de visite depuis plus de 15 jours. Une notification de rappel peut les ramener.
          </p>
        </div>
      )}
    </main>
  )
}

function Tile({ label, value, accent, warn }: {
  label: string; value: number; accent?: boolean; warn?: boolean
}) {
  return (
    <div className="bg-[#1C1C18] border border-[rgba(201,168,76,0.12)] rounded-2xl p-5">
      <div className={`text-3xl font-semibold font-variant-numeric mb-1 ${
        accent ? 'text-[#C9A84C]' : warn ? 'text-orange-400' : 'text-[#F0EBE0]'
      }`} style={{ fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <div className="text-xs text-[rgba(240,235,224,0.5)] font-medium tracking-wide uppercase">
        {label}
      </div>
    </div>
  )
}
