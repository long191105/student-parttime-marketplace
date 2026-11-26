import { useEffect, useMemo, useState } from 'react'
import { ArrowDownUp, ChevronDown, RotateCcw, SlidersHorizontal, X } from 'lucide-react'
import type { Listing } from '../domain/Listing'
import { locations, type CategoryOption } from '../data/categories'
import { ListingCard } from '../components/ListingCard'
import { getProvinceWards, type LocationOption } from '../services/AdministrativeLocationApi'
import { formatCurrencyAmount, handleCurrencyInputChange } from '../utils/CurrencyInput'

interface SearchPageProps {
  listings: Listing[]
  savedIds: string[]
  query: string
  categories: CategoryOption[]
  category: string
  location: string
  onQueryChange: (value: string) => void
  onCategoryChange: (category: string) => void
  onLocationChange: (location: string) => void
  onOpen: (listing: Listing) => void
  onToggleSaved: (id: string) => void
}

export function SearchPage({ listings, savedIds, query, categories, category, location, onQueryChange, onCategoryChange, onLocationChange, onOpen, onToggleSaved }: SearchPageProps) {
  const [condition, setCondition] = useState('Tất cả')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState('newest')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [categoryExpanded, setCategoryExpanded] = useState(false)
  const [wards, setWards] = useState<LocationOption[]>([])
  const [wardsForLocation, setWardsForLocation] = useState('')
  const [wardCode, setWardCode] = useState('')
  const [isLoadingWards, setIsLoadingWards] = useState(false)

  const visibleListings = listings
    .filter((listing) => category === 'Tất cả' || listing.category === category)
    .filter((listing) => {
      if (!wardCode || wardsForLocation !== location || location === 'Toàn quốc') return true
      const wardName = wards.find((ward) => String(ward.code) === wardCode)?.name
      return !wardName || listing.location.includes(wardName)
    })
    .filter((listing) => condition === 'Tất cả'
      || (condition === 'Miễn phí' ? listing.giveaway || listing.price === 0 : listing.conditionLabel === condition))
    .filter((listing) => !minPrice || listing.price >= Number(minPrice))
    .filter((listing) => !maxPrice || listing.price <= Number(maxPrice))
    .sort((a, b) => sort === 'price-low' ? a.price - b.price : sort === 'price-high' ? b.price - a.price : 0)

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    listings.forEach((listing) => {
      counts.set(listing.category, (counts.get(listing.category) ?? 0) + 1)
    })
    return counts
  }, [listings])

  const provinceOptions = locations.filter((item) => item !== 'Toàn quốc')

  useEffect(() => {
    if (location === 'Toàn quốc') return

    const controller = new AbortController()
    let active = true
    void getProvinceWards(location, controller.signal)
      .then(({ wards: nextWards }) => {
        if (!active) return
        setWards(nextWards)
        setWardsForLocation(location)
        setWardCode('')
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        if (!active) return
        console.error('Không thể tải danh sách phường/xã.', error)
        setWards([])
        setWardsForLocation(location)
        setWardCode('')
      })
      .finally(() => {
        if (active) setIsLoadingWards(false)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [location])

  function clearFilters() {
    onCategoryChange('Tất cả')
    onLocationChange('Toàn quốc')
    setWardCode('')
    setCondition('Tất cả')
    setMinPrice('')
    setMaxPrice('')
  }

  return (
    <div className="search-page">
      <div className="breadcrumbs"><button type="button" onClick={() => onQueryChange('')}>Trang chủ</button><span>/</span><strong>Kết quả tìm kiếm</strong></div>
      <div className="search-page-heading"><div><span className="section-eyebrow">MÓN HỜI QUANH BẠN</span><h1>{query ? `Kết quả cho “${query}”` : 'Khám phá món đồ hay'}</h1><p>{visibleListings.length} món đồ phù hợp đang chờ bạn.</p></div><button className="filter-mobile-toggle" onClick={() => setMobileFiltersOpen(true)}><SlidersHorizontal size={17} /> Bộ lọc</button></div>
      <div className="search-layout">
        <aside className={`filter-panel ${mobileFiltersOpen ? 'filter-panel-open' : ''}`}>
          <div className="filter-heading">
            <strong><SlidersHorizontal size={17} /> Bộ lọc</strong>
            <button type="button" className="filter-reset" onClick={clearFilters}><RotateCcw size={13} /> Đặt lại</button>
            <button type="button" className="filter-close" onClick={() => setMobileFiltersOpen(false)} aria-label="Đóng bộ lọc"><X size={18} /></button>
          </div>
          <span className="filter-section-heading">Danh mục <ChevronDown size={15} /></span>
          <div className="filter-options">
            {(categoryExpanded ? categories : categories.slice(0, 5)).map((item) => {
              const Icon = item.icon
              return (
                <label className={category === item.name ? 'filter-option-selected' : ''} key={item.name}>
                  <input type="radio" name="category" checked={category === item.name} onChange={() => onCategoryChange(item.name)} />
                  <Icon size={16} />
                  <span>{item.name}</span>
                  <small>{categoryCounts.get(item.name) ?? 0}</small>
                </label>
              )
            })}
          </div>
          <button type="button" className="filter-expand" onClick={() => setCategoryExpanded((current) => !current)}>
            {categoryExpanded ? 'Thu gọn' : 'Xem thêm'} <ChevronDown className={categoryExpanded ? 'filter-expand-up' : ''} size={14} />
          </button>

          <span className="filter-section-heading">Tỉnh / thành</span>
          <div className="select-wrap province-select">
            <select aria-label="Lọc theo tỉnh hoặc thành phố" value={location} onChange={(event) => {
              const nextLocation = event.target.value
              setWardCode('')
              setWards([])
              setIsLoadingWards(nextLocation !== 'Toàn quốc')
              onLocationChange(nextLocation)
            }}>
              <option value="Toàn quốc">Tất cả tỉnh/thành</option>
              {provinceOptions.map((province) => <option key={province} value={province}>{province}</option>)}
            </select>
            <ChevronDown size={15} />
          </div>

          <span className="filter-section-heading">Phường / xã</span>
          <div className="select-wrap province-select">
            <select
              aria-label="Lọc theo phường hoặc xã"
              value={wardCode}
              disabled={location === 'Toàn quốc' || isLoadingWards || wardsForLocation !== location || wards.length === 0}
              onChange={(event) => setWardCode(event.target.value)}
            >
              <option value="">
                {isLoadingWards || wardsForLocation !== location ? 'Đang tải phường/xã...' : location === 'Toàn quốc' ? 'Chọn tỉnh/thành trước' : 'Tất cả phường/xã'}
              </option>
              {wards.map((ward) => <option key={ward.code} value={ward.code}>{ward.name}</option>)}
            </select>
            <ChevronDown size={15} />
          </div>

          <span className="filter-section-heading">Tình trạng</span>
          <div className="condition-chips">
            {['Tất cả', 'Mới', 'Đã sử dụng', 'Miễn phí'].map((option) => (
              <button type="button" className={condition === option ? 'condition-chip-active' : ''} key={option} onClick={() => setCondition(option)}>{option}</button>
            ))}
          </div>

          <span className="filter-section-heading">Khoảng giá (đ)</span>
          <div className="price-inputs"><input aria-label="Giá từ" type="text" inputMode="numeric" placeholder="Từ" value={formatCurrencyAmount(minPrice)} onChange={(event) => handleCurrencyInputChange(event, setMinPrice)} /><span>—</span><input aria-label="Giá đến" type="text" inputMode="numeric" placeholder="Đến" value={formatCurrencyAmount(maxPrice)} onChange={(event) => handleCurrencyInputChange(event, setMaxPrice)} /></div>
          <button type="button" className="filter-apply" onClick={() => setMobileFiltersOpen(false)}><SlidersHorizontal size={15} /> Áp dụng bộ lọc</button>
        </aside>
        {mobileFiltersOpen && <button className="filter-backdrop" aria-label="Đóng bộ lọc" onClick={() => setMobileFiltersOpen(false)} />}
        <section className="search-results">
          <div className="results-toolbar"><div><strong>{visibleListings.length} kết quả</strong><span> được tìm thấy</span></div><label className="sort-picker"><ArrowDownUp size={15} /><select aria-label="Sắp xếp" value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Mới nhất</option><option value="price-low">Giá thấp đến cao</option><option value="price-high">Giá cao đến thấp</option></select><ChevronDown size={14} /></label></div>
          {visibleListings.length ? <div className="listing-grid search-results-grid">{visibleListings.map((listing) => <ListingCard key={listing.id} listing={listing} saved={savedIds.includes(listing.id)} onOpen={onOpen} onToggleSaved={onToggleSaved} />)}</div> : <div className="empty-state"><span>⌕</span><h3>Chưa tìm thấy món đồ phù hợp</h3><p>Thử đổi từ khóa hoặc nới rộng khoảng giá nhé.</p><button className="button-primary" onClick={() => { onQueryChange(''); clearFilters() }}>Xóa bộ lọc</button></div>}
        </section>
      </div>
    </div>
  )
}
