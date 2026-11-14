import type { CardType, PassConfig } from '@/types'

export const PASS_CONFIGS: Record<CardType, PassConfig> = {
  homme: {
    type: 'homme',
    label: 'Barbershop',
    subLabel: 'HAIR\'ITAGE — Homme',
    totalStamps: 5,
    gift: '1 coupe gratuite',
    backgroundColor: 'rgb(44, 24, 16)',
    foregroundColor: 'rgb(240, 235, 224)',
    labelColor: 'rgb(201, 168, 76)',
    stripColor: 'rgb(92, 58, 30)',
  },
  coiffure: {
    type: 'coiffure',
    label: 'Salon Coiffure',
    subLabel: 'HAIR\'ITAGE — Coiffure',
    totalStamps: 8,
    gift: '1 brushing gratuit',
    backgroundColor: 'rgb(45, 27, 46)',
    foregroundColor: 'rgb(240, 235, 224)',
    labelColor: 'rgb(201, 168, 76)',
    stripColor: 'rgb(107, 63, 107)',
  },
  esthetique: {
    type: 'esthetique',
    label: 'Institut Esthétique',
    subLabel: 'HAIR\'ITAGE — Esthétique',
    totalStamps: 8,
    gift: '1 soin visage offert',
    backgroundColor: 'rgb(26, 10, 16)',
    foregroundColor: 'rgb(240, 235, 224)',
    labelColor: 'rgb(201, 168, 76)',
    stripColor: 'rgb(139, 34, 82)',
  },
}

export function getStampLabel(stamps: number, total: number): string {
  if (stamps >= total) return '🎁 Cadeau disponible !'
  return `${stamps} / ${total} tampons`
}
