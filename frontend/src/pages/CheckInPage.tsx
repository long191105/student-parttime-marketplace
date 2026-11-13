import { useState } from 'react'
import { ArrowLeft, CalendarCheck, Check, Gift, Sparkles, Star } from 'lucide-react'
import { ChoHoiWordmark } from '../components/ChoHoiWordmark'

interface CheckInPageProps {
  userId: number | null
  onBack: () => void
}

interface CheckInProgress {
  checkedInDate: string | null
  streakDay: number
  totalPoints: number
}

const EMPTY_PROGRESS: CheckInProgress = { checkedInDate: null, streakDay: 0, totalPoints: 0 }
const DAILY_REWARDS = [20, 20, 20, 20, 20, 20, 50]

function getDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function readProgress(storageKey: string): CheckInProgress {
  const saved = window.localStorage.getItem(storageKey)
  if (!saved) return EMPTY_PROGRESS

  try {
    const parsed: unknown = JSON.parse(saved)
    if (
      typeof parsed === 'object'
      && parsed !== null
      && 'checkedInDate' in parsed
      && (parsed.checkedInDate === null || typeof parsed.checkedInDate === 'string')
      && 'streakDay' in parsed
      && typeof parsed.streakDay === 'number'
      && Number.isInteger(parsed.streakDay)
      && parsed.streakDay >= 0
      && parsed.streakDay <= 7
      && 'totalPoints' in parsed
      && typeof parsed.totalPoints === 'number'
      && Number.isInteger(parsed.totalPoints)
      && parsed.totalPoints >= 0
    ) {
      return {
        checkedInDate: parsed.checkedInDate,
        streakDay: parsed.streakDay,
        totalPoints: parsed.totalPoints,
      }
    }
    console.error('Dữ liệu điểm danh đã lưu không đúng định dạng.')
  } catch (error) {
    console.error('Không thể đọc dữ liệu điểm danh đã lưu.', error)
  }
  return EMPTY_PROGRESS
}

export function CheckInPage({ userId, onBack }: CheckInPageProps) {
  const storageKey = `chohoi.check-in.v1.${userId ?? 'guest'}`
  const [progress, setProgress] = useState(() => readProgress(storageKey))
  const today = getDateKey(new Date())
  const yesterdayDate = new Date()
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const isCheckedInToday = progress.checkedInDate === today
  const isStreakActive = progress.checkedInDate === getDateKey(yesterdayDate)
  const currentDay = isCheckedInToday
    ? progress.streakDay
    : isStreakActive
      ? progress.streakDay % 7 + 1
      : 1
  const currentReward = DAILY_REWARDS[currentDay - 1]

  function claimDailyReward() {
    if (userId === null || isCheckedInToday) return

    const nextProgress: CheckInProgress = {
      checkedInDate: today,
      streakDay: currentDay,
      totalPoints: progress.totalPoints + currentReward,
    }
    window.localStorage.setItem(storageKey, JSON.stringify(nextProgress))
    setProgress(nextProgress)
  }

  return (
    <div className="check-in-page">
      <button className="check-in-back" type="button" onClick={onBack}><ArrowLeft size={16} /> Về trang chủ</button>
      <header className="check-in-hero">
        <div className="check-in-hero-copy">
          <div className="check-in-brand"><span className="check-in-brand-icon"><CalendarCheck size={19} /></span><span><ChoHoiWordmark className="check-in-wordmark" /><small>ĐIỂM THƯỞNG</small></span></div>
          <span className="check-in-hero-kicker"><Sparkles size={12} /> QUÀ MỖI NGÀY · HỜI MỖI TUẦN</span>
          <h1>Điểm danh<br /><span>rinh quà cực hời!</span></h1>
          <p>Chăm ghé ChoHoi mỗi ngày, tích điểm đổi niềm vui.</p>
        </div>
        <div className="check-in-hero-art" aria-hidden="true">
          <span className="check-in-orbit check-in-orbit-one" />
          <span className="check-in-orbit check-in-orbit-two" />
          <Sparkles className="check-in-art-spark check-in-art-spark-one" size={20} />
          <Sparkles className="check-in-art-spark check-in-art-spark-two" size={14} />
          <div className="check-in-gift-box"><Gift size={51} strokeWidth={1.5} /></div>
          <span className="check-in-art-coins">+20 <Star size={12} fill="currentColor" /></span>
        </div>
        <div className="check-in-balance"><span className="check-in-balance-label"><Star size={15} fill="currentColor" /> Điểm của bạn</span><strong>{progress.totalPoints.toLocaleString('vi-VN')} <small>điểm</small></strong><span className="check-in-balance-caption">Cứ đều đặn là có quà!</span></div>
      </header>

      <section className="check-in-card">
        <div className="check-in-card-heading">
          <div className="check-in-card-title"><span className="check-in-gift-icon">🎁</span><div><h1>Điểm danh nhận quà</h1><p>Giữ chuỗi 7 ngày để nhận thưởng lớn!</p></div></div>
          <span className="check-in-streak">{isCheckedInToday ? 'Đã điểm danh hôm nay' : `Ngày ${currentDay} trong chuỗi`}</span>
        </div>
        <div className="check-in-days">
          {DAILY_REWARDS.map((reward, index) => {
            const day = index + 1
            const isClaimed = isCheckedInToday
              ? day <= progress.streakDay
              : isStreakActive && progress.streakDay < 7 && day <= progress.streakDay
            const isToday = !isCheckedInToday && day === currentDay
            return (
              <div className={`check-in-day ${isClaimed ? 'check-in-day-claimed' : ''} ${isToday ? 'check-in-day-today' : ''} ${day === 7 ? 'check-in-day-bonus' : ''}`} key={day}>
                <strong>+{reward}</strong>
                <span className="check-in-day-icon">{isClaimed ? <Check size={15} /> : <Star size={14} fill="currentColor" />}</span>
                <small>{isClaimed ? 'Đã nhận' : isToday ? 'Nhận ngay' : `Ngày ${day}`}</small>
                {day === 7 && <span className="check-in-bonus-tag">THƯỞNG</span>}
              </div>
            )
          })}
        </div>
        <button className="check-in-claim-button" type="button" onClick={claimDailyReward} disabled={userId === null || isCheckedInToday}>
          {userId === null
            ? <><Gift size={17} /> Đăng nhập để điểm danh</>
            : isCheckedInToday
              ? <><Check size={17} /> Đã điểm danh hôm nay</>
              : <><Gift size={17} /> Điểm danh nhận {currentReward} điểm</>}
        </button>
        <p className="check-in-footnote">Mỗi ngày điểm danh một lần. Bỏ lỡ một ngày sẽ bắt đầu lại chuỗi.</p>
      </section>

    </div>
  )
}
