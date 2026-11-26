import { Bike, Building2, Cat, Laptop, Shirt, Sofa, Sparkles, type LucideIcon } from 'lucide-react'
import { seedListings } from './seedListings'

export interface CategoryOption {
  name: string
  icon: LucideIcon
  image?: string
}

const categoryImages = new Map<string, string>()
for (const listing of seedListings) {
  if (listing.status === 'ACTIVE' && !categoryImages.has(listing.category)) {
    categoryImages.set(listing.category, listing.image)
  }
}

const featuredCategoryImages: Record<string, string> = {
  'Bất động sản': 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80',
  'Đồ gia dụng': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80',
  'Thú cưng': 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=400&q=80',
  'Khác': 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80',
}

export const categories: CategoryOption[] = [
  { name: 'Điện tử', icon: Laptop },
  { name: 'Xe cộ', icon: Bike },
  { name: 'Bất động sản', icon: Building2 },
  { name: 'Thời trang', icon: Shirt },
  { name: 'Đồ gia dụng', icon: Sofa },
  { name: 'Thú cưng', icon: Cat },
  { name: 'Khác', icon: Sparkles },
].map((category) => ({
  ...category,
  image: featuredCategoryImages[category.name] ?? categoryImages.get(category.name),
}))

export function categoriesForNames(names: string[]): CategoryOption[] {
  const knownCategories = new Map(categories.map((category) => [category.name, category]))
  return names.map((name) => knownCategories.get(name) ?? { name, icon: Sparkles, image: undefined })
}

export const locations = [
  'Toàn quốc',
  'An Giang',
  'Bắc Ninh',
  'Cà Mau',
  'Cao Bằng',
  'Cần Thơ',
  'Đà Nẵng',
  'Đắk Lắk',
  'Điện Biên',
  'Đồng Nai',
  'Đồng Tháp',
  'Gia Lai',
  'Hà Nội',
  'Hà Tĩnh',
  'Hải Phòng',
  'TP. Hồ Chí Minh',
  'Huế',
  'Hưng Yên',
  'Khánh Hòa',
  'Lai Châu',
  'Lâm Đồng',
  'Lạng Sơn',
  'Lào Cai',
  'Nghệ An',
  'Ninh Bình',
  'Phú Thọ',
  'Quảng Ngãi',
  'Quảng Ninh',
  'Quảng Trị',
  'Sơn La',
  'Tây Ninh',
  'Thái Nguyên',
  'Thanh Hóa',
  'Tuyên Quang',
  'Vĩnh Long',
]
