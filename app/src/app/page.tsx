import Link from 'next/link'

const Logo = () => (
  <svg width="48" height="48" viewBox="0 0 52 52" fill="none">
    <rect x="4" y="6" width="4.5" height="40" fill="#C9A84C"/>
    <rect x="11.5" y="6" width="4.5" height="40" fill="#C9A84C"/>
    <rect x="36" y="6" width="4.5" height="40" fill="#C9A84C"/>
    <rect x="43.5" y="6" width="4.5" height="40" fill="#C9A84C"/>
    <rect x="4" y="21.5" width="44" height="4" fill="#C9A84C"/>
    <rect x="4" y="28" width="44" height="4" fill="#C9A84C"/>
  </svg>
)

const cards = [
  { type: 'homme',      emoji: '✂',  label: 'Barbershop',         sub: '5 coupes = 1 gratuite',       color: 'from-[#2C1810] to-[#5C3A1E]' },
  { type: 'coiffure',   emoji: '✿',  label: 'Salon Coiffure',     sub: '8 visites = 1 brushing',      color: 'from-[#2D1B2E] to-[#6B3F6B]' },
  { type: 'esthetique', emoji: '✦',  label: 'Institut Esthétique', sub: '8 soins = 1 soin offert',    color: 'from-[#1A0A10] to-[#8B2252]' },
]

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-16">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 mb-16">
        <Logo />
        <h1 className="text-[#C9A84C] tracking-[0.28em] text-xl uppercase" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          Hair'itage
        </h1>
        <p className="text-[rgba(240,235,224,0.5)] text-sm text-center max-w-xs">
          Choisissez votre carte de fidélité
        </p>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-4 w-full max-w-sm">
        {cards.map(card => (
          <Link key={card.type} href={`/join/${card.type}`}>
            <div className={`bg-gradient-to-br ${card.color} rounded-2xl p-6 flex items-center gap-4 cursor-pointer hover:scale-[1.02] transition-transform`}>
              <span className="text-3xl">{card.emoji}</span>
              <div>
                <div className="font-semibold text-white text-base">{card.label}</div>
                <div className="text-[rgba(255,255,255,0.65)] text-sm mt-0.5">{card.sub}</div>
              </div>
              <svg className="ml-auto text-[rgba(255,255,255,0.4)]" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          </Link>
        ))}
      </div>

      <p className="mt-12 text-[rgba(240,235,224,0.3)] text-xs text-center">
        Compatible Apple Wallet &amp; Google Wallet
      </p>
    </main>
  )
}
