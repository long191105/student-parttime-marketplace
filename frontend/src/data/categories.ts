import { Bike, Building2, Cat, Laptop, Shirt, Sofa, Sparkles } from 'lucide-react'
import { seedListings } from './seedListings'

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

export const categories = [
  { name: 'Điện tử', icon: Laptop, amount: '2.4k tin' },
  { name: 'Xe cộ', icon: Bike, amount: '1.8k tin' },
  { name: 'Bất động sản', icon: Building2, amount: '986 tin' },
  { name: 'Thời trang', icon: Shirt, amount: '1.2k tin' },
  { name: 'Đồ gia dụng', icon: Sofa, amount: '840 tin' },
  { name: 'Thú cưng', icon: Cat, amount: '316 tin' },
  { name: 'Khác', icon: Sparkles, amount: '560 tin' },
].map((category) => ({
  ...category,
  image: featuredCategoryImages[category.name] ?? categoryImages.get(category.name),
}))

export const locations = [
  'Toàn quốc',
  'An Giang',
  'Bà Rịa - Vũng Tàu',
  'Bắc Giang',
  'Bắc Kạn',
  'Bạc Liêu',
  'Bắc Ninh',
  'Bến Tre',
  'Bình Định',
  'Bình Dương',
  'Bình Phước',
  'Bình Thuận',
  'Cà Mau',
  'Cần Thơ',
  'Cao Bằng',
  'Đà Nẵng',
  'Đắk Lắk',
  'Đắk Nông',
  'Điện Biên',
  'Đồng Nai',
  'Đồng Tháp',
  'Gia Lai',
  'Hà Giang',
  'Hà Nam',
  'Hà Nội',
  'Hà Tĩnh',
  'Hải Dương',
  'Hải Phòng',
  'Hậu Giang',
  'Hòa Bình',
  'Hưng Yên',
  'Khánh Hòa',
  'Kiên Giang',
  'Kon Tum',
  'Lai Châu',
  'Lâm Đồng',
  'Lạng Sơn',
  'Lào Cai',
  'Long An',
  'Nam Định',
  'Nghệ An',
  'Ninh Bình',
  'Ninh Thuận',
  'Phú Thọ',
  'Phú Yên',
  'Quảng Bình',
  'Quảng Nam',
  'Quảng Ngãi',
  'Quảng Ninh',
  'Quảng Trị',
  'Sóc Trăng',
  'Sơn La',
  'Tây Ninh',
  'Thái Bình',
  'Thái Nguyên',
  'Thanh Hóa',
  'Thừa Thiên Huế',
  'Tiền Giang',
  'TP. Hồ Chí Minh',
  'Trà Vinh',
  'Tuyên Quang',
  'Vĩnh Long',
  'Vĩnh Phúc',
  'Yên Bái',
]
