type BrandLockupProps = { className?: string }

export function BrandLockup({ className = '' }: BrandLockupProps) {
  return (
    <a className={`brand-lockup ${className}`} href="/" aria-label="DHL trang chủ">
      <span className="brand-logo-tile"><img src="/logo_DHL_transparent.png" alt="" /></span>
      <span>DHL</span>
    </a>
  )
}