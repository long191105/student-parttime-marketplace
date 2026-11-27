import { useLayoutEffect, useRef } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, HeartHandshake, ShieldCheck } from 'lucide-react'
import type { CategoryOption } from '../data/categories'
import type { Listing } from '../domain/Listing'
import { ListingCard } from '../components/ListingCard'

interface ExplorePageProps {
  listings: Listing[]
  savedIds: string[]
  categoryCounts: Map<string, number>
  categories: CategoryOption[]
  onOpen: (listing: Listing) => void
  onToggleSaved: (id: string) => void
  onCategory: (category: string) => void
}

export function ExplorePage({ listings, savedIds, categoryCounts, categories, onOpen, onToggleSaved, onCategory }: ExplorePageProps) {
  const categoryRailRef = useRef<HTMLDivElement>(null)
  const userInteractingRef = useRef(false)
  const autoPauseUntilRef = useRef(0)

  useLayoutEffect(() => {
    const rail = categoryRailRef.current
    const track = rail?.firstElementChild
    const firstSet = track?.firstElementChild
    if (!rail || !track || !firstSet) return

    const getCycleWidth = () => firstSet.getBoundingClientRect().width + (Number.parseFloat(window.getComputedStyle(track).columnGap) || 0)
    let cycleWidth = getCycleWidth()
    const resetPosition = () => {
      cycleWidth = getCycleWidth()
      rail.scrollLeft = cycleWidth >= rail.clientWidth ? cycleWidth : 0
    }

    resetPosition()
    window.addEventListener('resize', resetPosition)

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return () => window.removeEventListener('resize', resetPosition)
    }

    let frameId = 0
    let lastFrameTime = 0
    let fractionalDistance = 0
    const animate = (time: number) => {
      const carouselStage = rail.parentElement
      const isPaused = document.visibilityState !== 'visible'
        || carouselStage?.matches(':hover')
        || carouselStage?.contains(document.activeElement)
        || userInteractingRef.current
        || performance.now() < autoPauseUntilRef.current

      if (isPaused) {
        lastFrameTime = 0
        fractionalDistance = 0
      } else if (cycleWidth >= rail.clientWidth && cycleWidth > 0) {
        const elapsed = lastFrameTime ? Math.min(time - lastFrameTime, 50) : 0
        fractionalDistance += elapsed * 0.03
        const pixelDelta = Math.floor(fractionalDistance)
        if (pixelDelta > 0) {
          rail.scrollLeft += pixelDelta
          fractionalDistance -= pixelDelta
          if (rail.scrollLeft >= cycleWidth * 2) rail.scrollLeft -= cycleWidth
          else if (rail.scrollLeft < cycleWidth) rail.scrollLeft += cycleWidth
        }
        lastFrameTime = time
      }

      frameId = window.requestAnimationFrame(animate)
    }

    frameId = window.requestAnimationFrame(animate)
    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resetPosition)
    }
  }, [categories.length])

  const scrollCategories = (direction: -1 | 1) => {
    const rail = categoryRailRef.current
    if (!rail || categories.length < 2) return

    const track = rail.firstElementChild
    const firstSet = track?.firstElementChild
    const firstTile = firstSet?.firstElementChild
    const gap = firstSet ? Number.parseFloat(window.getComputedStyle(firstSet).columnGap) || 0 : 0
    const setGap = track ? Number.parseFloat(window.getComputedStyle(track).columnGap) || 0 : 0
    const step = (firstTile?.getBoundingClientRect().width ?? rail.clientWidth / 2) + gap
    const cycleWidth = firstSet ? firstSet.getBoundingClientRect().width + setGap : 0

    if (cycleWidth > 0) {
      const nextPosition = rail.scrollLeft + direction * step
      if (direction === 1 && nextPosition >= cycleWidth * 2) rail.scrollLeft -= cycleWidth
      else if (direction === -1 && nextPosition < cycleWidth) rail.scrollLeft += cycleWidth
    }

    autoPauseUntilRef.current = performance.now() + 800
    rail.scrollBy({ left: direction * step, behavior: 'smooth' })
  }

  return (
    <div className="explore-page">
      <section className="trust-strip" aria-label="Cam kết của Chợ Hời">
        <span><ShieldCheck size={19} /><span><strong>Mua bán an tâm</strong><small>Tin đăng qua kiểm duyệt</small></span></span>
        <span><HeartHandshake size={20} /><span><strong>Gặp người gần bạn</strong><small>Giao dịch trực tiếp, tiện lợi</small></span></span>
        <span><BadgeCheck size={19} /><span><strong>Cộng đồng tử tế</strong><small>Đánh giá người bán rõ ràng</small></span></span>
        <button onClick={() => onCategory('Tất cả')}>Tìm hiểu thêm <ArrowUpRight size={15} /></button>
      </section>

      <section className="category-section">
        <div className="section-title-row">
          <div><span className="section-eyebrow">CHOHOI · TÌM THEO DANH MỤC</span><h2>Có gì bạn đang tìm?</h2></div>
          <button className="section-link" onClick={() => onCategory('Tất cả')}>Tất cả danh mục <ArrowRight size={15} /></button>
        </div>
        <div
          className="category-carousel-stage"
          onPointerDown={() => { userInteractingRef.current = true }}
          onPointerUp={() => {
            userInteractingRef.current = false
            autoPauseUntilRef.current = performance.now() + 800
          }}
          onPointerCancel={() => { userInteractingRef.current = false }}
        >
          <button className="category-carousel-arrow category-carousel-arrow-previous" type="button" aria-label="Danh mục trước" onClick={() => scrollCategories(-1)}><ArrowLeft size={16} /></button>
          <div className="category-carousel-viewport" ref={categoryRailRef} role="region" aria-label="Danh mục sản phẩm" aria-roledescription="băng chuyền" tabIndex={0}>
            <div className="category-grid">
              {[0, 1, 2].map((copyIndex) => (
                <div className="category-loop-set" key={copyIndex} aria-hidden={copyIndex !== 1}>
                  {categories.map(({ name, icon: Icon, image }, index) => (
                    <button className={`category-tile category-tone-${index + 1}`} key={`${copyIndex}-${name}`} tabIndex={copyIndex === 1 ? undefined : -1} onClick={() => onCategory(name)}>
                      <span className="category-icon">{image ? <img src={image} alt="" loading="lazy" /> : <Icon size={24} strokeWidth={1.7} />}</span><span className="category-name">{name}</span><small>{categoryCounts.get(name) ?? 0} tin</small>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <button className="category-carousel-arrow category-carousel-arrow-next" type="button" aria-label="Danh mục tiếp theo" onClick={() => scrollCategories(1)}><ArrowRight size={16} /></button>
        </div>
      </section>

      <section className="latest-section" id="latest-listings">
        <div className="section-title-row"><div><span className="section-eyebrow">VỪA LÊN KỆ</span><h2>Món hời mới nhất</h2><p className="section-description">Những món đồ vừa tìm thấy chủ nhân mới quanh bạn.</p></div><button className="section-link" onClick={() => onCategory('Tất cả')}>Xem tất cả <ArrowRight size={15} /></button></div>
        <div className="listing-grid">
          {listings.slice(0, 8).map((listing) => <ListingCard key={listing.id} listing={listing} saved={savedIds.includes(listing.id)} onOpen={onOpen} onToggleSaved={onToggleSaved} />)}
        </div>
        <button className="load-more-button" onClick={() => onCategory('Tất cả')}>Khám phá thêm tin đăng <ArrowRight size={16} /></button>
      </section>

    </div>
  )
}
