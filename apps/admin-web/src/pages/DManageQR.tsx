import { useEffect, useRef, useState, type ReactNode } from 'react'

import {
  AdminDashboardLayout,
  BoothMetricIcon,
  CheckMetricIcon,
  ChevronDownIcon,
  DashboardDaySelector,
  DashboardContent,
  type DashboardDay,
  DashboardMetricCard,
  EntryMetricIcon
} from '../components/AdminDashboardLayout'

type QrMode = 'booth' | 'performance'
type QrModeConfig = {
  label: string
  countLabel?: string
  countValue?: string
  title: string
  reviewTitle: string
  nameLabel: string
  rejectSummary: string
  stats: Array<{ label: string; value: string; icon: ReactNode }>
  reviewItems: Array<{ name: string; reason: string; personName: string; recent: string }>
}

const qrModes: Record<QrMode, QrModeConfig> = {
  booth: {
    label: '부스',
    countLabel: '총 부스 개수',
    countValue: '15',
    title: '부스 QR 관리',
    reviewTitle: '입장 거절 로그',
    nameLabel: '부스 이름',
    rejectSummary: '거절 3건',
    stats: [
      { label: '전체 스캔 수', value: '214', icon: <EntryMetricIcon /> },
      { label: '승인', value: '182', icon: <CheckMetricIcon /> },
      { label: '거절', value: '3', icon: <RejectMetricIcon /> }
    ],
    reviewItems: [
      { name: 'BEER HOUSE', reason: '중복 입장 시도', personName: '김민준', recent: '오늘 14:20' },
      { name: 'Cocktails', reason: '유효하지 않은 패스', personName: '박서연', recent: '오늘 13:45' },
      { name: '푸드트럭 존', reason: '중복 입장 시도', personName: '이도윤', recent: '오늘 12:10' }
    ]
  },
  performance: {
    label: '공연',
    title: '공연 QR 관리',
    reviewTitle: '입장 거절 로그',
    nameLabel: '대기 번호',
    rejectSummary: '거절 3건',
    stats: [
      { label: '전체 스캔 수', value: '486', icon: <EntryMetricIcon /> },
      { label: '승인', value: '421', icon: <CheckMetricIcon /> },
      { label: '거절', value: '3', icon: <RejectMetricIcon /> },
      { label: '대기 명수', value: '62', icon: <WaitMetricIcon /> }
    ],
    reviewItems: [
      { name: '255', reason: '입장 시간 전 스캔', personName: '최지우', recent: '오늘 15:05' },
      { name: '123', reason: '대기열 미등록', personName: '정하준', recent: '오늘 14:32' },
      { name: '782', reason: '좌석 정원 초과', personName: '한서아', recent: '오늘 19:18' }
    ]
  }
}

const dayQrStats: Record<DashboardDay, Record<QrMode, {
  countValue?: string
  statValues: string[]
  rejectSummary: string
  reviewItems: QrModeConfig['reviewItems']
}>> = {
  'Day 1': {
    booth: {
      countValue: '15',
      statValues: ['214', '182', '3'],
      rejectSummary: '거절 3건',
      reviewItems: qrModes.booth.reviewItems
    },
    performance: {
      statValues: ['486', '421', '3', '62'],
      rejectSummary: '거절 3건',
      reviewItems: qrModes.performance.reviewItems
    }
  },
  'Day 2': {
    booth: {
      countValue: '18',
      statValues: ['268', '231', '3'],
      rejectSummary: '거절 3건',
      reviewItems: [
        { name: '푸드트럭 존', reason: '이미 사용된 패스 재시도', personName: '오지훈', recent: '오늘 14:48' },
        { name: '체험존 A', reason: '입장 가능 시간 전 스캔', personName: '강유나', recent: '오늘 13:18' },
        { name: '굿즈 스토어', reason: '권한 없는 패스 유형', personName: '문태오', recent: '오늘 12:42' }
      ]
    },
    performance: {
      statValues: ['538', '462', '3', '74'],
      rejectSummary: '거절 3건',
      reviewItems: [
        { name: '410', reason: '좌석 정원 초과', personName: '신예린', recent: '오늘 18:10' },
        { name: '118', reason: '대기열 미등록', personName: '윤재현', recent: '오늘 16:32' },
        { name: '690', reason: '공연 회차 불일치', personName: '백서준', recent: '오늘 15:20' }
      ]
    }
  },
  'Day 3': {
    booth: {
      countValue: '16',
      statValues: ['239', '208', '3'],
      rejectSummary: '거절 3건',
      reviewItems: [
        { name: '포토존', reason: '중복 입장 시도', personName: '장민서', recent: '오늘 15:14' },
        { name: '이벤트 부스', reason: '만료된 QR 스캔', personName: '임도현', recent: '오늘 14:03' },
        { name: 'Cocktails', reason: '외부인 패스 제한', personName: '서아린', recent: '오늘 12:52' }
      ]
    },
    performance: {
      statValues: ['502', '438', '3', '55'],
      rejectSummary: '거절 3건',
      reviewItems: [
        { name: '305', reason: '입장 시간 초과', personName: '조하늘', recent: '오늘 17:35' },
        { name: '532', reason: '대기 번호 미호출', personName: '권시우', recent: '오늘 16:44' },
        { name: '621', reason: '패스 유형 불일치', personName: '남유진', recent: '오늘 13:26' }
      ]
    }
  }
}

function getRecentMinutes(recent: string) {
  const time = recent.match(/(\d{1,2}):(\d{2})/)
  if (!time) {
    return Number.MAX_SAFE_INTEGER
  }

  return Number(time[1]) * 60 + Number(time[2])
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function DManageQR() {
  const [mode, setMode] = useState<QrMode>('booth')
  const [selectedDay, setSelectedDay] = useState<DashboardDay>('Day 1')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const admissionTimerRef = useRef<number | null>(null)
  const [isAdmissionProcessing, setIsAdmissionProcessing] = useState(false)
  const [totalSeats, setTotalSeats] = useState(500)
  const [remainingSeats, setRemainingSeats] = useState(84)
  const [allowedWaitNumber, setAllowedWaitNumber] = useState(30)
  const selectedMode = qrModes[mode]
  const selectedDayStats = dayQrStats[selectedDay][mode]
  const stats = selectedMode.countLabel && selectedMode.countValue
    ? [
        { label: selectedMode.countLabel, value: selectedDayStats.countValue ?? selectedMode.countValue, icon: <BoothMetricIcon /> },
        ...selectedMode.stats.map((stat, index) => ({ ...stat, value: selectedDayStats.statValues[index] ?? stat.value }))
      ]
    : selectedMode.stats.map((stat, index) => ({ ...stat, value: selectedDayStats.statValues[index] ?? stat.value }))
  const sortedReviewItems = [...selectedDayStats.reviewItems].sort(
    (firstItem, secondItem) => getRecentMinutes(firstItem.recent) - getRecentMinutes(secondItem.recent)
  )
  const waitingCount = mode === 'performance' ? Number(stats.find((stat) => stat.label === '대기 명수')?.value ?? 0) : 0

  const handleSelectMode = (nextMode: QrMode) => {
    setMode(nextMode)
    setIsDropdownOpen(false)
  }

  const handleTotalSeatsChange = (value: string) => {
    const nextValue = clampNumber(Number(value), 0, 9999)
    setTotalSeats(nextValue)
    setRemainingSeats((currentSeats) => Math.min(currentSeats, nextValue))
  }

  const handleRemainingSeatsChange = (value: string) => {
    setRemainingSeats(clampNumber(Number(value), 0, totalSeats))
  }

  const handleAllowedWaitNumberChange = (value: string) => {
    setAllowedWaitNumber(clampNumber(Number(value), 0, waitingCount))
  }

  const handleStartAdmission = () => {
    if (isAdmissionProcessing) {
      return
    }

    alert('입장을 진행합니다! 입장이 완료되기 전까지 입장 버튼이 비활성화 됩니다.')
    setIsAdmissionProcessing(true)
    admissionTimerRef.current = window.setTimeout(() => {
      setIsAdmissionProcessing(false)
      admissionTimerRef.current = null
    }, 5000)
  }

  useEffect(() => {
    return () => {
      if (admissionTimerRef.current !== null) {
        window.clearTimeout(admissionTimerRef.current)
      }
    }
  }, [])

  return (
    <AdminDashboardLayout activeSection="qr">
      <DashboardContent>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-[31px] font-bold leading-tight">현장 QR 관리</h2>
          <DashboardDaySelector value={selectedDay} onChange={setSelectedDay} />
        </div>

        <section className="rounded-[10px] bg-white px-6 py-6 shadow-[7px_9px_30px_rgba(0,0,0,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-[21px] font-semibold">{selectedMode.title}</h3>
            <div className="relative">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isDropdownOpen}
                onClick={() => setIsDropdownOpen((open) => !open)}
                className="flex h-[44px] min-w-[116px] items-center justify-between gap-8 rounded-[10px] border border-[#e1e1e1] bg-white px-5 text-[15px] font-medium shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
              >
                {selectedMode.label}
                <ChevronDownIcon />
              </button>

              {isDropdownOpen ? (
                <div
                  role="listbox"
                  aria-label="QR 관리 유형 선택"
                  className="absolute right-0 z-20 mt-2 w-[116px] overflow-hidden rounded-[10px] border border-[#e1e1e1] bg-white py-1 shadow-[0_10px_24px_rgba(0,0,0,0.12)]"
                >
                  {(['booth', 'performance'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      role="option"
                      aria-selected={mode === option}
                      onClick={() => handleSelectMode(option)}
                      className={`block w-full px-5 py-3 text-left text-[15px] font-semibold transition ${
                        mode === option
                          ? 'bg-[#e8f1ff] text-[#2f80ff]'
                          : 'text-[#313131] hover:bg-[#f5f8ff]'
                      }`}
                    >
                      {qrModes[option].label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-4">
            {stats.map((stat) => (
              <DashboardMetricCard key={stat.label} {...stat} />
            ))}
          </div>

          {mode === 'performance' ? (
            <section className="mt-6 rounded-[10px] border border-[#e1e1e1] bg-[#fbfdff] px-5 py-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-[19px] font-semibold text-[#1a1a1a]">공연 입장 제어</h4>
                  <p className="mt-1 text-[14px] font-medium text-[#6b7280]">
                    좌석 현황과 입장 가능 대기 번호를 조절합니다.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isAdmissionProcessing}
                  onClick={handleStartAdmission}
                  className="flex h-11 items-center justify-center rounded-[10px] bg-[#0097ce] px-8 text-[16px] font-semibold text-white transition hover:bg-[#0087b8] disabled:cursor-not-allowed disabled:bg-[#9bcfe2] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#0097ce]/30"
                >
                  {isAdmissionProcessing ? '입장 진행 중' : '입장'}
                </button>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <label className="block rounded-[10px] bg-white px-4 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
                  <span className="text-[14px] font-semibold text-[#6b7280]">공연장 총 좌석수</span>
                  <input
                    type="number"
                    min={0}
                    max={9999}
                    value={totalSeats}
                    onChange={(event) => handleTotalSeatsChange(event.target.value)}
                    className="mt-3 h-11 w-full rounded-[10px] border border-[#d9d9d9] px-4 text-[20px] font-bold text-[#1a1a1a] outline-none focus:border-[#2f80ff]"
                  />
                </label>

                <label className="block rounded-[10px] bg-white px-4 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
                  <span className="text-[14px] font-semibold text-[#6b7280]">남은 좌석수</span>
                  <input
                    type="number"
                    min={0}
                    max={totalSeats}
                    value={remainingSeats}
                    onChange={(event) => handleRemainingSeatsChange(event.target.value)}
                    className="mt-3 h-11 w-full rounded-[10px] border border-[#d9d9d9] px-4 text-[20px] font-bold text-[#1a1a1a] outline-none focus:border-[#2f80ff]"
                  />
                </label>

                <label className="block rounded-[10px] bg-white px-4 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
                  <span className="text-[14px] font-semibold text-[#6b7280]">
                    입장 가능 대기 번호
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={waitingCount}
                    value={allowedWaitNumber}
                    onChange={(event) => handleAllowedWaitNumberChange(event.target.value)}
                    className="mt-3 h-11 w-full rounded-[10px] border border-[#d9d9d9] px-4 text-[20px] font-bold text-[#1a1a1a] outline-none focus:border-[#2f80ff]"
                  />
                </label>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between text-[14px] font-semibold text-[#6b7280]">
                  <span>0번</span>
                  <span>현재 대기 {waitingCount}명</span>
                </div>
                <input
                  aria-label="입장 가능 대기 번호 조절"
                  type="range"
                  min={0}
                  max={waitingCount}
                  value={allowedWaitNumber}
                  onChange={(event) => handleAllowedWaitNumberChange(event.target.value)}
                  className="mt-3 h-2 w-full cursor-pointer accent-[#0097ce]"
                />
              </div>
            </section>
          ) : null}
        </section>

        <section className="mt-6 rounded-[10px] bg-white px-6 py-6 shadow-[7px_9px_30px_rgba(0,0,0,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-[21px] font-semibold">{selectedMode.reviewTitle}</h3>
            <span className="rounded-full bg-[#fff1f0] px-4 py-2 text-[14px] font-semibold text-[#ff352e]">
              {selectedDayStats.rejectSummary}
            </span>
          </div>

          <div className="mt-5 grid gap-4">
            {sortedReviewItems.map((item) => (
              <article
                key={`${item.name}-${item.reason}`}
                className="grid gap-4 rounded-[10px] border border-[#e1e1e1] bg-white px-5 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)] md:grid-cols-[1.1fr_1.5fr_1fr_auto]"
              >
                <div>
                  <p className="text-[14px] font-semibold text-[#6b7280]">{selectedMode.nameLabel}</p>
                  <h4 className="mt-2 text-[20px] font-bold text-[#1a1a1a]">{item.name}</h4>
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[#6b7280]">입장 거절 사유</p>
                  <p className="mt-2 text-[18px] font-semibold text-[#313131]">{item.reason}</p>
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[#6b7280]">이름</p>
                  <p className="mt-2 text-[18px] font-semibold text-[#313131]">{item.personName}</p>
                </div>
                <div className="flex items-center gap-3 md:justify-end">
                  <span className="text-[14px] font-medium text-[#6b7280]">{item.recent}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </DashboardContent>
    </AdminDashboardLayout>
  )
}

function WaitMetricIcon() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function RejectMetricIcon() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </svg>
  )
}
