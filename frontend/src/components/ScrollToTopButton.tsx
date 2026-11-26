import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    function updateVisibility() {
      setIsVisible(window.scrollY > 280)
    }

    updateVisibility()
    window.addEventListener('scroll', updateVisibility, { passive: true })
    return () => window.removeEventListener('scroll', updateVisibility)
  }, [])

  if (!isVisible) return null

  return (
    <button
      className="scroll-to-top"
      type="button"
      aria-label="Cuộn lên đầu trang"
      title="Cuộn lên đầu trang"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <ArrowUp size={19} />
    </button>
  )
}
