import { ArrowUpRight, CalendarCheck, X } from 'lucide-react'
import { useState } from 'react'
import type { AppView } from './MarketplaceLayout'

interface FloatingPromotionsProps {
  onNavigate: (view: AppView) => void
  view: AppView
}

export function FloatingPromotions({ onNavigate, view }: FloatingPromotionsProps) {
  const [visiblePromotions, setVisiblePromotions] = useState({ discover: true, sell: true })

  if (view === 'check-in' || (!visiblePromotions.discover && !visiblePromotions.sell)) return null

  return (
    <aside className="floating-promotions" aria-label="Khám phá ChoHoi">
      {visiblePromotions.discover && (
        <div className="floating-promo floating-promo-discover">
          <button className="floating-promo-button" type="button" aria-label="Khám phá món hời trên ChoHoi" title="Khám phá món hời" onClick={() => onNavigate('search')}><span className="floating-promo-spark" aria-hidden="true">✦</span><span className="floating-promo-emoji" aria-hidden="true">🛍️</span><span className="floating-promo-label">HỜI</span><ArrowUpRight className="floating-promo-arrow" size={12} /></button>
          <button className="floating-promo-close" type="button" aria-label="Đóng ưu đãi khám phá" onClick={() => setVisiblePromotions((current) => ({ ...current, discover: false }))}><X size={11} /></button>
        </div>
      )}
      {visiblePromotions.sell && (
        <div className="floating-promo floating-promo-checkin">
          <button className="floating-promo-button" type="button" aria-label="Điểm danh nhận quà trên ChoHoi" title="Điểm danh nhận quà" onClick={() => onNavigate('check-in')}><span className="floating-promo-spark" aria-hidden="true">✦</span><CalendarCheck className="floating-promo-checkin-icon" size={29} strokeWidth={1.8} /><span className="floating-promo-label">NHẬN QUÀ</span><ArrowUpRight className="floating-promo-arrow" size={12} /></button>
          <button className="floating-promo-close" type="button" aria-label="Đóng điểm danh nhận quà" onClick={() => setVisiblePromotions((current) => ({ ...current, sell: false }))}><X size={11} /></button>
        </div>
      )}
    </aside>
  )
}
