interface ChoHoiWordmarkProps {
  className?: string
}

export function ChoHoiWordmark({ className = '' }: ChoHoiWordmarkProps) {
  return (
    <span className={`chohoi-wordmark ${className}`.trim()} aria-label="Chợ Hời">
      <span className="chohoi-wordmark-market">chợ</span><span className="chohoi-wordmark-deal">hời</span><span className="chohoi-wordmark-spark" aria-hidden="true">✳</span>
    </span>
  )
}
