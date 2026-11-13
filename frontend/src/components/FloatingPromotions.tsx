import { ArrowUpRight, CalendarCheck, Gift, ShoppingBag, X } from 'lucide-react'
import { useState } from 'react'
import type { AppView } from './MarketplaceLayout'

interface FloatingPromotionsProps {
  onNavigate: (view: AppView) => void
  view: AppView
}

export function FloatingPromotions({ onNavigate, view }: FloatingPromotionsProps) {
  const [minimizedPromotions, setMinimizedPromotions] = useState({ discover: false, sell: false })

  if (view === 'check-in') return null

  const hasMinimizedPromotions = minimizedPromotions.discover || minimizedPromotions.sell
  const hasVisiblePromotions = !minimizedPromotions.discover || !minimizedPromotions.sell

  return (
    <>
      {hasVisiblePromotions && (
        <aside className={`floating-promotions${hasMinimizedPromotions ? ' floating-promotions-has-minimized' : ''}`} aria-label="Khám phá ChoHoi">
          {!minimizedPromotions.discover && (
            <div className="floating-promo floating-promo-discover">
              <button className="floating-promo-button" type="button" aria-label="Khám phá món hời trên ChoHoi" title="Khám phá món hời" onClick={() => onNavigate('search')}><span className="floating-promo-spark" aria-hidden="true">✦</span><span className="floating-promo-emoji" aria-hidden="true">🛍️</span><span className="floating-promo-label">HỜI</span><ArrowUpRight className="floating-promo-arrow" size={12} /></button>
              <button className="floating-promo-close" type="button" aria-label="Thu nhỏ ưu đãi khám phá" onClick={() => setMinimizedPromotions((current) => ({ ...current, discover: true }))}><X size={11} /></button>
            </div>
          )}
          {!minimizedPromotions.sell && (
            <div className="floating-promo floating-promo-checkin">
              <button className="floating-promo-button" type="button" aria-label="Điểm danh nhận quà trên ChoHoi" title="Điểm danh nhận quà" onClick={() => onNavigate('check-in')}><span className="floating-promo-spark" aria-hidden="true">✦</span><CalendarCheck className="floating-promo-checkin-icon" size={29} strokeWidth={1.8} /><span className="floating-promo-label">NHẬN QUÀ</span><ArrowUpRight className="floating-promo-arrow" size={12} /></button>
              <button className="floating-promo-close" type="button" aria-label="Thu nhỏ điểm danh nhận quà" onClick={() => setMinimizedPromotions((current) => ({ ...current, sell: true }))}><X size={11} /></button>
            </div>
          )}
        </aside>
      )}
      {hasMinimizedPromotions && (
        <aside className="floating-promo-dock" aria-label="Ưu đãi đã thu nhỏ">
          {minimizedPromotions.discover && (
            <button className="floating-promo-minimized floating-promo-minimized-discover" type="button" aria-label="Hiện lại ưu đãi khám phá" title="Hiện lại ưu đãi khám phá" onClick={() => setMinimizedPromotions((current) => ({ ...current, discover: false }))}>
              <ShoppingBag size={19} />
            </button>
          )}
          {minimizedPromotions.sell && (
            <button className="floating-promo-minimized floating-promo-minimized-checkin" type="button" aria-label="Hiện lại điểm danh nhận quà" title="Hiện lại điểm danh nhận quà" onClick={() => setMinimizedPromotions((current) => ({ ...current, sell: false }))}>
              <Gift size={19} />
            </button>
          )}
        </aside>
      )}
    </>
  )
}
