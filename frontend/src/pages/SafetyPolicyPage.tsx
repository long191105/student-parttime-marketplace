import { ArrowLeft, AlertTriangle, Eye, LockKeyhole, MapPin, MessageCircleWarning, ShieldCheck, TriangleAlert } from 'lucide-react'

interface SafetyPolicyPageProps {
  onBack: () => void
}

const safetyRules = [
  { icon: MapPin, title: 'Giao dịch nơi công cộng', text: 'Ưu tiên khu vực đông người, ban ngày và có camera. Không chia sẻ địa chỉ nhà riêng nếu chưa cần thiết.' },
  { icon: Eye, title: 'Kiểm tra trước khi trả tiền', text: 'Đối chiếu sản phẩm với tin đăng. Với hàng điện tử, bật nguồn và kiểm tra chức năng trước khi nhận.' },
  { icon: LockKeyhole, title: 'Bảo vệ thông tin cá nhân', text: 'Không gửi mã OTP, mật khẩu, số thẻ hoặc thông tin định danh cho người khác.' },
  { icon: TriangleAlert, title: 'Cảnh giác chuyển khoản', text: 'Không chuyển tiền trước cho người lạ. Nghi ngờ đặt cọc, trúng thưởng hoặc đường dẫn thanh toán bất thường.' },
  { icon: AlertTriangle, title: 'Tránh hàng bị hạn chế', text: 'Không đăng hoặc mua hàng giả, hàng gian lận, hàng cấm và sản phẩm không rõ nguồn gốc.' },
  { icon: MessageCircleWarning, title: 'Báo cáo nội dung đáng ngờ', text: 'Ghi lại bằng chứng, báo cáo tin đăng hoặc liên hệ Chợ Hời khi phát hiện hành vi lừa đảo.' },
]

export function SafetyPolicyPage({ onBack }: SafetyPolicyPageProps) {
  return (
    <div className="policy-page">
      <button className="guide-back" type="button" onClick={onBack}>
        <ArrowLeft size={16} /> Về trang chủ
      </button>

      <header className="policy-hero">
        <span className="policy-icon"><ShieldCheck size={28} /></span>
        <div>
          <span className="guide-kicker">Chính sách an toàn</span>
          <h1>An tâm mua bán quanh bạn</h1>
          <p>Chợ Hời khuyến nghị mọi giao dịch minh bạch, gặp mặt trực tiếp và có kiểm chứng rõ ràng.</p>
        </div>
      </header>

      <section className="policy-list" aria-label="Các nguyên tắc giao dịch an toàn">
        {safetyRules.map(({ icon: Icon, title, text }, index) => (
          <article className="policy-rule" key={title}>
            <span className="policy-rule-number">{String(index + 1).padStart(2, '0')}</span>
            <span className="policy-rule-icon"><Icon size={20} /></span>
            <div><h2>{title}</h2><p>{text}</p></div>
          </article>
        ))}
      </section>

      <aside className="policy-contact">
        <div>
          <strong>Nếu gặp vấn đề?</strong>
          <p>Gửi email kèm mô tả và hình ảnh bằng chứng để đội ngũ hỗ trợ kiểm tra.</p>
        </div>
        <a className="button-primary" href="mailto:nhom4@gmail.com">Liên hệ hỗ trợ</a>
      </aside>
    </div>
  )
}
