import { ArrowLeft, BadgeCheck, BookOpen, ChevronRight, MessageCircle, PackageCheck, Search, ShieldCheck, Store } from 'lucide-react'

interface BuyingGuidePageProps {
  onBack: () => void
  onExplore: () => void
  onStartSelling: () => void
}

const buyerSteps = [
  { icon: Search, title: 'Tìm món phù hợp', text: 'Chọn danh mục, khu vực và dùng từ khóa để thu hẹp tin đăng.' },
  { icon: ShieldCheck, title: 'Kiểm tra tin đăng', text: 'Xem hình ảnh, tình trạng, mô tả, giá và đánh giá của người bán.' },
  { icon: MessageCircle, title: 'Trao đổi trực tiếp', text: 'Nhắn rõ nhu cầu, hỏi nguồn gốc, lịch sử sử dụng và thời gian giao hàng.' },
  { icon: PackageCheck, title: 'Nhận hàng an toàn', text: 'Kiểm tra sản phẩm tại nơi công cộng hoặc tại nhà trước khi thanh toán.' },
]

const sellerSteps = [
  { icon: PackageCheck, title: 'Mô tả trung thực', text: 'Chọn danh mục đúng, ghi rõ tình trạng, giá, khuyết điểm và địa điểm.' },
  { icon: BadgeCheck, title: 'Tải ảnh rõ ràng', text: 'Đăng ảnh thật, đủ góc nhìn và không che khuất tình trạng sản phẩm.' },
  { icon: MessageCircle, title: 'Phản hồi lịch sự', text: 'Cập nhật trạng thái, thống nhất giao nhận và giữ lịch hẹn đã xác nhận.' },
  { icon: Store, title: 'Giao dịch minh bạch', text: 'Không yêu cầu đặt cọc ngoài nền tảng hoặc gửi thông tin ngân hàng cá nhân.' },
]

export function BuyingGuidePage({ onBack, onExplore, onStartSelling }: BuyingGuidePageProps) {
  return (
    <div className="guide-page">
      <button className="guide-back" type="button" onClick={onBack}>
        <ArrowLeft size={16} /> Quay lại
      </button>

      <header className="guide-hero">
        <img
          className="guide-hero-banner"
          src="/bannerhuongdan.png"
          alt="Hướng dẫn Chợ Hời: Mua dễ, bán gọn, giao dịch an tâm"
        />
        <div className="guide-hero-actions">
          <button className="guide-search" type="button" onClick={onExplore}><Search size={19} /><span>Tìm hiểu cách mua bán...</span></button>
          <button className="button-primary" type="button" onClick={onExplore}><BookOpen size={16} /> Khám phá món</button>
          <button className="button-secondary" type="button" onClick={onStartSelling}><Store size={16} /> Đăng tin bán</button>
        </div>
      </header>

      <section className="guide-section">
        <div className="guide-section-heading">
          <div><h2>Hướng dẫn người mua</h2><p>Chọn đúng món và xác nhận trước khi thanh toán.</p></div>
        </div>
        <div className="guide-step-grid">
          {buyerSteps.map(({ icon: Icon, title, text }) => (
            <article className="guide-step" key={title}>
              <span className="guide-step-icon"><Icon size={19} /></span>
              <div className="guide-step-copy"><h3>{title}</h3><p>{text}</p></div>
              <ChevronRight className="guide-step-chevron" size={18} />
            </article>
          ))}
        </div>
      </section>

      <section className="guide-section">
        <div className="guide-section-heading">
          <div><h2>Hướng dẫn người bán</h2><p>Tạo tin đáng tin cậy để gặp đúng người mua.</p></div>
        </div>
        <div className="guide-step-grid">
          {sellerSteps.map(({ icon: Icon, title, text }) => (
            <article className="guide-step" key={title}>
              <span className="guide-step-icon"><Icon size={19} /></span>
              <div className="guide-step-copy"><h3>{title}</h3><p>{text}</p></div>
              <ChevronRight className="guide-step-chevron" size={18} />
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
