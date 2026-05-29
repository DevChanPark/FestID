import { useState, type ReactNode } from 'react'

type DashboardSection = 'current' | 'qr' | 'booth' | 'auth' | 'report' | 'setting'
export type DashboardDay = 'Day 1' | 'Day 2' | 'Day 3'

const dashboardDays: DashboardDay[] = ['Day 1', 'Day 2', 'Day 3']

const navItems: Array<{
  key: DashboardSection
  label: string
  href: string
  icon: ReactNode
}> = [
  { key: 'current', label: '축제 현황', href: '/dFestCurrent', icon: <TrendIcon /> },
  { key: 'qr', label: '현장 QR 관리', href: '/dmanageQR', icon: <QrIcon /> },
  { key: 'booth', label: '부스 관리', href: '/dmanageBooth', icon: <BoothIcon /> },
  { key: 'auth', label: '권한 관리', href: '/dmanageAuth', icon: <ShieldIcon /> },
  { key: 'report', label: '운영 리포트', href: '/dReport', icon: <ReportIcon /> },
  { key: 'setting', label: '설정', href: '/dSetting', icon: <GearIcon /> }
]

export function AdminDashboardLayout({
  activeSection,
  children
}: {
  activeSection: DashboardSection
  children: ReactNode
}) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)

  return (
    <main className="min-h-screen bg-white font-sans text-[#1a1a1a]">
      <div className="flex min-h-screen w-full bg-white">
        <aside className="hidden w-[260px] shrink-0 border-r border-[#e7e7e7] bg-white px-4 pb-[55px] pt-5 lg:block">
          <h1 className="font-brand px-8 text-[35px] leading-none text-[#0097ce] mt-2">CamPass</h1>
          <nav aria-label="대시보드 메뉴" className="mt-[55px] space-y-5">
            {navItems.map((item) => {
              const active = item.key === activeSection

              return (
                <a
                  key={item.key}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex h-[76px] items-center gap-5 rounded-[10px] px-7 text-[18px] font-semibold transition ${
                    active
                      ? 'bg-[#e8f1ff] text-[#2f80ff]'
                      : 'text-[#313131] hover:bg-[#f5f8ff] hover:text-[#2f80ff]'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              )
            })}
          </nav>
        </aside>

        <section className="relative flex min-w-0 flex-1 flex-col">
          <header className="flex min-h-[100px] items-center gap-5 px-5 py-5 sm:px-10">
            <div className="relative min-w-0 flex-1">
              <SearchIcon />
              <input
                aria-label="검색창"
                className="h-[59px] w-full rounded-[30px] border border-[#d8d8d8] bg-white pl-[74px] pr-5 text-[18px] shadow-[0_2px_10px_rgba(0,0,0,0.08)] outline-none placeholder:text-[#bababa] focus:border-[#2f80ff]"
                placeholder="검색창"
                type="search"
              />
            </div>
            <div className="hidden sm:block">
              <button
                type="button"
                aria-label="알림"
                aria-expanded={isNotificationOpen}
                onClick={() => setIsNotificationOpen((open) => !open)}
                className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full text-[#313131] transition hover:bg-[#f5f8ff]"
              >
                <BellIcon />
                <span className="absolute right-2 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff4d5a] px-1 text-[12px] font-bold leading-none text-white">
                  3
                </span>
              </button>
            </div>
            <button
              type="button"
              className="hidden h-[56px] items-center gap-4 rounded-[10px] border border-[#e1e1e1] bg-white px-5 text-[17px] font-semibold shadow-[0_2px_10px_rgba(0,0,0,0.06)] transition hover:border-[#2f80ff] md:flex"
            >
              축제 1
              <ChevronDownIcon />
            </button>
            <button
              type="button"
              aria-label="프로필"
              className="hidden h-[61px] w-[61px] items-center justify-center rounded-full border border-[#e1e1e1] bg-white text-[#313131] shadow-[0_2px_10px_rgba(0,0,0,0.06)] sm:flex"
            >
              <UserIcon />
            </button>
          </header>

          <div className="flex-1 bg-[#fcfcfc] px-5 py-8 sm:px-10">{children}</div>

          {isNotificationOpen ? <NotificationPanel /> : null}
        </section>
      </div>
    </main>
  )
}

export function DashboardContent({ children }: { children: ReactNode }) {
  return (
    <div
      data-dashboard-content
      className="w-full lg:w-[calc(100%-287px)]"
    >
      {children}
    </div>
  )
}

export function DashboardDaySelector({
  value,
  onChange
}: {
  value: DashboardDay
  onChange: (day: DashboardDay) => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-[46px] items-center gap-3 rounded-[20px] border-2 border-[#86b6ff] bg-white px-5 text-[19px] font-semibold text-[#2f80ff] shadow-[0_2px_10px_rgba(47,128,255,0.12)] transition hover:border-[#2f80ff]"
      >
        {value}
        <ChevronDownIcon />
      </button>

      {isOpen ? (
        <div
          role="listbox"
          aria-label="Day 선택"
          className="absolute right-0 top-[54px] z-30 w-[118px] overflow-hidden rounded-[10px] border border-[#d8d8d8] bg-white py-1 shadow-[0_10px_24px_rgba(0,0,0,0.12)]"
        >
          {dashboardDays.map((day) => (
            <button
              key={day}
              type="button"
              role="option"
              aria-selected={value === day}
              onClick={() => {
                onChange(day)
                setIsOpen(false)
              }}
              className={`block w-full px-4 py-3 text-left text-[15px] font-semibold transition ${
                value === day ? 'bg-[#e8f1ff] text-[#2f80ff]' : 'text-[#313131] hover:bg-[#f5f8ff]'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function DashboardMetricCard({
  label,
  value,
  icon
}: {
  label: string
  value: string
  icon: ReactNode
}) {
  return (
    <article className="flex min-h-[112px] items-center gap-5 rounded-[10px] bg-white px-6 shadow-[7px_9px_30px_rgba(0,0,0,0.08)]">
      <IconWrap>{icon}</IconWrap>
      <div>
        <p className="break-keep text-[15px] font-medium text-[#313131]">{label}</p>
        <p className="mt-1 text-[31px] font-semibold leading-none">{value}</p>
      </div>
    </article>
  )
}

export function ChevronDownIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 7.5 5 5 5-5" />
    </svg>
  )
}

export function BoothMetricIcon() {
  return <BoothIcon />
}

export function EntryMetricIcon() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.8-3.2 2.6-4.8 5.5-4.8 1.6 0 2.9.5 3.8 1.5" />
      <path d="M18 10v8M14 14h8" />
    </svg>
  )
}

export function GroupMetricIcon() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="3" />
      <circle cx="5.5" cy="10" r="2.2" />
      <circle cx="18.5" cy="10" r="2.2" />
      <path d="M7 20c.6-3.1 2.2-4.7 5-4.7s4.4 1.6 5 4.7" />
      <path d="M2.5 18c.4-2 1.5-3.1 3.2-3.2M21.5 18c-.4-2-1.5-3.1-3.2-3.2" />
    </svg>
  )
}

export function CheckMetricIcon() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="m8.5 12.3 2.4 2.4 4.8-5.4" />
    </svg>
  )
}

function IconWrap({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[#eaf2ff] text-[#2f80ff]">
      {children}
    </span>
  )
}

function NotificationPanel() {
  return (
    <section
      aria-label="알림 목록"
      className="absolute right-10 top-[100px] z-40 hidden min-h-[390px] w-[260px] rounded-[10px] border border-[#e1e1e1] bg-white px-5 py-5 shadow-[0_12px_32px_rgba(0,0,0,0.12)] 2xl:block"
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[18px] font-bold">알림</h2>
        <span className="rounded-full bg-[#eaf2ff] px-3 py-1 text-[12px] font-semibold text-[#2f80ff]">3개</span>
      </div>

      <div className="space-y-5">
        <NotificationItem title="부스 이미지 매칭 완료" description="22개 부스 이미지가 정상 등록되었습니다." />
        <NotificationItem title="QR 인증 오류 확인 필요" description="게이트 A에서 중복 인증 1건이 감지되었습니다." />
        <NotificationItem title="운영 리포트 생성 완료" description="Day 1 운영 리포트를 다운로드할 수 있습니다." />
      </div>
    </section>
  )
}

function NotificationItem({ title, description }: { title: string; description: string }) {
  return (
    <article className="border-b border-[#ededed] pb-4 last:border-b-0">
      <div>
        <p className="text-[14px] font-bold text-[#1a1a1a]">{title}</p>
        <p className="mt-2 break-keep text-[13px] font-medium leading-5 text-[#6b7280]">{description}</p>
      </div>
    </article>
  )
}

function TrendIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 17 9 11l4 4 7-8" />
      <path d="M14 7h6v6" />
    </svg>
  )
}

function QrIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" />
      <path d="M14 14h2v2h-2zM18 14h2v6h-6v-2h4z" />
    </svg>
  )
}

function BoothIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 10h14l-1-5H6z" />
      <path d="M6 10v9h12v-9" />
      <path d="M9 19v-5h6v5" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3 5 6v6c0 4.5 3 7.4 7 9 4-1.6 7-4.5 7-9V6z" />
      <circle cx="12" cy="11" r="2" />
      <path d="M8.5 17c.8-1.7 2-2.5 3.5-2.5s2.7.8 3.5 2.5" />
    </svg>
  )
}

function ReportIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 4h14v16H5z" />
      <path d="M9 17v-5M12 17V8M15 17v-3" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 .9l-.1.2h-4l-.1-.2a1.7 1.7 0 0 0-1-.9 1.7 1.7 0 0 0-1.9.3l-.1.1L4 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-.9-1l-.2-.1v-4l.2-.1a1.7 1.7 0 0 0 .9-1 1.7 1.7 0 0 0-.3-1.9L4 6.8 6.8 4l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-.9l.1-.2h4l.1.2a1.7 1.7 0 0 0 1 .9 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.8 2.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 .9 1l.2.1v4l-.2.1a1.7 1.7 0 0 0-.9 1Z" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg className="pointer-events-none absolute left-[28px] top-1/2 h-7 w-7 -translate-y-1/2 text-[#313131]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg className="h-9 w-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21c1.2-4 3.5-6 7-6s5.8 2 7 6" />
    </svg>
  )
}
