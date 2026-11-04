import { useState } from 'react'
import { ArrowDownUp, ChevronDown, SlidersHorizontal, X } from 'lucide-react'
import type { Listing } from '../domain/Listing'
import { categories } from '../data/categories'
import { ListingCard } from '../components/ListingCard'

interface SearchPageProps {
  listings: Listing[]
  savedIds: string[]
  query: string
  category: string
  onQueryChange: (value: string) => void
  onCategoryChange: (category: string) => void
  onOpen: (listing: Listing) => void
  onToggleSaved: (id: string) => void
}

export function SearchPage({ listings, savedIds, query, category, onQueryChange, onCategoryChange, onOpen, onToggleSaved }: SearchPageProps) {
  const [condition, setCondition] = useState('Tất cả')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState('newest')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const visibleListings = listings
    .filter((listing) => category === 'Tất cả' || listing.category === category)
    .filter((listing) => condition === 'Tất cả' || listing.conditionLabel === condition)
    .filter((listing) => !minPrice || listing.price >= Number(minPrice))
    .filter((listing) => !maxPrice || listing.price <= Number(maxPrice))
    .sort((a, b) => sort === 'price-low' ? a.price - b.price : sort === 'price-high' ? b.price - a.price : 0)

  function clearFilters() {
    onCategoryChange('Tất cả')
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
          <div className="filter-heading"><strong><SlidersHorizontal size={17} /> Bộ lọc</strong><button className="filter-close" onClick={() => setMobileFiltersOpen(false)} aria-label="Đóng bộ lọc"><X size={18} /></button></div>
          <label className="filter-label">Danh mục</label>
          <div className="filter-options">
            <label><input type="radio" name="category" checked={category === 'Tất cả'} onChange={() => onCategoryChange('Tất cả')} />Tất cả danh mục</label>
            {categories.map((item) => <label key={item.name}><input type="radio" name="category" checked={category === item.name} onChange={() => onCategoryChange(item.name)} />{item.name}</label>)}
          </div>
          <label className="filter-label" htmlFor="condition">Tình trạng</label>
          <div className="select-wrap"><select id="condition" value={condition} onChange={(event) => setCondition(event.target.value)}><option>Tất cả</option><option>Mới</option><option>Đã sử dụng</option></select><ChevronDown size={15} /></div>
          <span className="filter-label">Khoảng giá (đ)</span>
          <div className="price-inputs"><input aria-label="Giá từ" inputMode="numeric" placeholder="Từ" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} /><span>—</span><input aria-label="Giá đến" inputMode="numeric" placeholder="Đến" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} /></div>
          <button className="filter-clear" onClick={clearFilters}>Xóa bộ lọc</button>
          <button className="filter-apply" onClick={() => setMobileFiltersOpen(false)}>Áp dụng bộ lọc</button>
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
