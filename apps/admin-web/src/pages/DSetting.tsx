import { useState, type ChangeEvent, type ReactNode } from 'react'

import {
  AdminDashboardLayout,
  DashboardDaySelector,
  DashboardContent,
  type DashboardDay
} from '../components/AdminDashboardLayout'
import { updateFestival } from '../lib/adminApi'
import { getAccessToken } from '../lib/auth'
import { readFileAsDataUrl } from '../lib/filePreview'
import { DEFAULT_FESTIVAL_INFO, getFestivalInfo, saveFestivalInfo, type FestivalInfo } from '../lib/localState'

export function DSetting() {
  const [selectedDay, setSelectedDay] = useState<DashboardDay>('Day 1')
  const [festivalInfo, setFestivalInfo] = useState(() => getFestivalInfo())

  const updateFestivalField = (field: keyof FestivalInfo, value: string) => {
    setFestivalInfo((current) => ({
      ...current,
      [field]: value
    }))
  }

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      window.alert('PNG 또는 JPG 파일만 업로드할 수 있습니다.')
      event.target.value = ''
      return
    }

    const imagePreviewUrl = await readFileAsDataUrl(file)

    setFestivalInfo((current) => ({
      ...current,
      imageName: file.name,
      imagePreviewUrl
    }))
  }

  const handleReset = () => {
    setFestivalInfo(DEFAULT_FESTIVAL_INFO)
  }

  const handleSave = async () => {
    const savedFestivalInfo = saveFestivalInfo(festivalInfo)
    setFestivalInfo(savedFestivalInfo)

    if (savedFestivalInfo.backendId && getAccessToken()) {
      try {
        await updateFestival(savedFestivalInfo.backendId, {
          name: savedFestivalInfo.name,
          schoolName: savedFestivalInfo.host,
          startDate: savedFestivalInfo.startDate,
          endDate: savedFestivalInfo.endDate,
          location: savedFestivalInfo.place,
          description: savedFestivalInfo.description
        })
      } catch (error) {
        console.warn('Festival settings were saved locally, but backend sync failed.', error)
      }
    }

    window.alert('축제 정보가 저장되었습니다.')
  }

  return (
    <AdminDashboardLayout activeSection="setting">
      <DashboardContent>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-[31px] font-bold leading-tight">설정</h2>
          <DashboardDaySelector value={selectedDay} onChange={setSelectedDay} />
        </div>

        <section className="rounded-[10px] border border-[#e1e1e1] bg-white px-6 py-6 shadow-[0_4px_18px_rgba(0,0,0,0.04)]">
          <h3 className="text-[22px] font-bold">축제 정보 수정</h3>
          <div className="mt-5 grid gap-7 lg:grid-cols-[1.12fr_1fr]">
            <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
              <TextField label="축제명" value={festivalInfo.name} onChange={(value) => updateFestivalField('name', value)} />
              <TextField label="주최사" value={festivalInfo.host} onChange={(value) => updateFestivalField('host', value)} />

              <div>
                <p className="mb-2 text-[15px] font-semibold">운영 기간</p>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                  <DateField value={festivalInfo.startDate} onChange={(value) => updateFestivalField('startDate', value)} />
                  <span className="font-bold text-[#454545]">~</span>
                  <DateField value={festivalInfo.endDate} onChange={(value) => updateFestivalField('endDate', value)} />
                </div>
              </div>

              <TextField label="운영 장소" value={festivalInfo.place} onChange={(value) => updateFestivalField('place', value)} />

              <label className="block">
                <span className="mb-2 block text-[15px] font-semibold">축제 설명</span>
                <span className="relative block">
                  <textarea
                    className="min-h-[110px] w-full resize-none rounded-[8px] border border-[#d8d8d8] bg-white px-4 py-3 text-[15px] font-medium leading-6 text-[#313131] outline-none focus:border-[#2f80ff]"
                    value={festivalInfo.description}
                    onChange={(event) => updateFestivalField('description', event.target.value)}
                    maxLength={500}
                  />
                  <span className="absolute bottom-3 right-4 text-[14px] font-semibold text-[#9ca3af]">
                    {festivalInfo.description.length} / 500
                  </span>
                </span>
              </label>
            </form>

            <div className="space-y-4">
              <div>
                <p className="mb-2 text-[15px] font-semibold">축제 이미지</p>
                <label className="flex min-h-[195px] cursor-pointer flex-col items-center justify-center rounded-[8px] border border-dashed border-[#bfc7d4] bg-[#fcfdff] px-5 text-center transition hover:border-[#2f80ff] hover:bg-[#f5f9ff]">
                  <input className="sr-only" type="file" accept="image/png,image/jpeg" onChange={handleImageChange} />
                  <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#eaf2ff] text-[#2f80ff]">
                    <CloudUploadIcon />
                  </span>
                  <span className="text-[15px] font-semibold text-[#454545]">이미지를 드래그하거나 클릭하여 업로드</span>
                  <span className="mt-5 max-w-full break-all rounded-[8px] border border-[#d8d8d8] bg-white px-5 py-2 text-[15px] font-semibold text-[#454545]">
                    {festivalInfo.imageName || '이미지 변경'}
                  </span>
                </label>
                <p className="mt-2 text-[14px] font-medium text-[#7a7a7a]">권장 비율 16:9, PNG 또는 JPG</p>
              </div>

              <div>
                <p className="mb-2 text-[15px] font-semibold">미리보기</p>
                <div className="relative h-[198px] overflow-hidden rounded-[10px] bg-[#142433] shadow-inner">
                  {festivalInfo.imagePreviewUrl ? (
                    <img
                      src={festivalInfo.imagePreviewUrl}
                      alt="축제 이미지 미리보기"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(255,218,128,0.8),transparent_18%),linear-gradient(180deg,rgba(105,139,173,0.35),rgba(8,15,24,0.65)),linear-gradient(90deg,#102a3c,#4f2b18)]" />
                  )}
                  <div className="absolute bottom-0 left-0 right-0 h-[88px] bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.72))]" />
                  <div className="absolute bottom-6 left-8 right-8 flex items-end justify-between">
                    <div className="space-y-1">
                      <span className="block max-w-[220px] truncate text-[15px] font-bold text-white">{festivalInfo.name}</span>
                      <span className="block max-w-[220px] truncate text-[13px] font-medium text-white/80">
                        {festivalInfo.place}
                      </span>
                    </div>
                    <span className="h-10 w-28 rounded-t-[6px] bg-[#1f2937] shadow-[0_0_24px_rgba(255,218,128,0.45)]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-7 flex justify-end gap-4">
            <button
              type="button"
              onClick={handleReset}
              className="h-[48px] min-w-[126px] rounded-[8px] border border-[#e1e1e1] bg-white px-6 text-[17px] font-semibold text-[#454545] transition hover:border-[#2f80ff] hover:text-[#2f80ff]"
            >
              초기화
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="h-[48px] min-w-[150px] rounded-[8px] bg-[#0b74f6] px-6 text-[17px] font-semibold text-white shadow-[0_4px_12px_rgba(11,116,246,0.25)] transition hover:bg-[#0967dc]"
            >
              저장하기
            </button>
          </div>
        </section>

        <section className="mt-5 rounded-[10px] border border-[#e1e1e1] bg-white px-6 py-6 shadow-[0_4px_18px_rgba(0,0,0,0.04)]">
          <h3 className="text-[22px] font-bold">계정 관리</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <AccountAction
              title="로그아웃"
              description="현재 관리자 세션을 종료하고 로그인 화면으로 이동합니다."
              buttonLabel="로그아웃"
              tone="neutral"
              icon={<LogoutIcon />}
              href="/loginAdmin"
            />
            <AccountAction
              title="회원 탈퇴"
              description="관리자 계정과 연결된 권한 정보를 삭제합니다."
              buttonLabel="탈퇴하기"
              tone="danger"
              icon={<UserRemoveIcon />}
            />
          </div>
        </section>
      </DashboardContent>
    </AdminDashboardLayout>
  )
}

function TextField({
  label,
  value,
  onChange
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[15px] font-semibold">{label}</span>
      <input
        className="h-[43px] w-full rounded-[8px] border border-[#d8d8d8] bg-white px-4 text-[15px] font-medium text-[#313131] outline-none focus:border-[#2f80ff]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function DateField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="relative block">
      <input
        className="h-[43px] w-full rounded-[8px] border border-[#d8d8d8] bg-white px-4 pr-11 text-[15px] font-semibold text-[#454545] outline-none focus:border-[#2f80ff]"
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b7280]">
        <CalendarIcon />
      </span>
    </label>
  )
}

function AccountAction({
  title,
  description,
  buttonLabel,
  tone,
  icon,
  href
}: {
  title: string
  description: string
  buttonLabel: string
  tone: 'neutral' | 'danger'
  icon: ReactNode
  href?: string
}) {
  const buttonClass =
    tone === 'danger'
      ? 'border-[#ff3b30] bg-white text-[#ff3b30] hover:bg-[#fff1f1]'
      : 'border-[#2f80ff] bg-[#2f80ff] text-white hover:bg-[#126de8]'

  return (
    <article className="flex items-center justify-between gap-4 rounded-[10px] border border-[#e1e1e1] px-5 py-4">
      <div className="flex min-w-0 items-center gap-4">
        <span
          className={
            tone === 'danger'
              ? 'flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] bg-[#ffeaea] text-[#ff3b30]'
              : 'flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] bg-[#eaf2ff] text-[#2f80ff]'
          }
        >
          {icon}
        </span>
        <div>
          <h4 className="text-[17px] font-bold">{title}</h4>
          <p className="mt-1 break-keep text-[14px] font-medium text-[#6b7280]">{description}</p>
        </div>
      </div>
      {href ? (
        <a
          href={href}
          className={`flex h-[42px] shrink-0 items-center justify-center rounded-[8px] border px-5 text-[15px] font-semibold transition ${buttonClass}`}
        >
          {buttonLabel}
        </a>
      ) : (
        <button
          type="button"
          className={`h-[42px] shrink-0 rounded-[8px] border px-5 text-[15px] font-semibold transition ${buttonClass}`}
        >
          {buttonLabel}
        </button>
      )}
    </article>
  )
}

function CloudUploadIcon() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 17V9" />
      <path d="m8 13 4-4 4 4" />
      <path d="M20 17.5a4.5 4.5 0 0 0-2.2-8.4A6 6 0 0 0 6.3 11 3.5 3.5 0 0 0 7 18h12" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 2v4M15 2v4M3 8h14M4 4h12a1 1 0 0 1 1 1v12H3V5a1 1 0 0 1 1-1Z" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 17 15 12l-5-5" />
      <path d="M15 12H3" />
      <path d="M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5" />
    </svg>
  )
}

function UserRemoveIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21c.9-4 2.9-6 6-6 2.2 0 3.9 1 5 3" />
      <path d="M17 11h5" />
    </svg>
  )
}
