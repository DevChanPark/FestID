import { useState, type ReactNode } from 'react'

import {
  AdminDashboardLayout,
  CheckMetricIcon,
  DashboardDaySelector,
  DashboardContent,
  type DashboardDay,
  DashboardMetricCard
} from '../components/AdminDashboardLayout'

const boothCardClassNames = [
  'bg-[linear-gradient(180deg,rgba(8,33,55,0.12),rgba(8,33,55,0.76)),radial-gradient(circle_at_65%_10%,rgba(255,217,139,0.85),transparent_16%),linear-gradient(135deg,#153a5b,#72532c_52%,#171717)]',
  'bg-[linear-gradient(180deg,rgba(18,20,23,0.05),rgba(18,20,23,0.78)),radial-gradient(circle_at_42%_16%,rgba(255,212,131,0.75),transparent_18%),linear-gradient(135deg,#123044,#754318_54%,#070707)]'
]

const boothDayData: Record<DashboardDay, {
  summaryStats: Array<{ label: string; value: string; icon: ReactNode }>
  booths: Array<{ id: string; name: string; description: string; imageLabel: string; className: string }>
}> = {
  'Day 1': {
    summaryStats: [
      { label: '등록 예정 부스 수', value: '24', icon: <CalendarMetricIcon /> },
      { label: '이미지 매칭 완료', value: '22', icon: <CheckMetricIcon /> },
      { label: '오류 항목', value: '2', icon: <WarningMetricIcon /> }
    ],
    booths: [
      { id: 'beer', name: '부스명', description: '부스 2번', imageLabel: 'BEER HOUSE', className: boothCardClassNames[0] },
      { id: 'cocktail', name: '부스명', description: '부스 설명', imageLabel: 'Cocktails', className: boothCardClassNames[1] }
    ]
  },
  'Day 2': {
    summaryStats: [
      { label: '등록 예정 부스 수', value: '28', icon: <CalendarMetricIcon /> },
      { label: '이미지 매칭 완료', value: '26', icon: <CheckMetricIcon /> },
      { label: '오류 항목', value: '1', icon: <WarningMetricIcon /> }
    ],
    booths: [
      { id: 'food', name: '푸드트럭 존', description: '메인 광장 6개 푸드트럭 운영', imageLabel: 'FOOD TRUCK', className: boothCardClassNames[0] },
      { id: 'goods', name: '굿즈 스토어', description: '한정 굿즈 및 기념품 판매', imageLabel: 'Goods', className: boothCardClassNames[1] }
    ]
  },
  'Day 3': {
    summaryStats: [
      { label: '등록 예정 부스 수', value: '25', icon: <CalendarMetricIcon /> },
      { label: '이미지 매칭 완료', value: '24', icon: <CheckMetricIcon /> },
      { label: '오류 항목', value: '0', icon: <WarningMetricIcon /> }
    ],
    booths: [
      { id: 'photo', name: '포토존', description: '졸업생 포토월 및 즉석 사진', imageLabel: 'PHOTO ZONE', className: boothCardClassNames[0] },
      { id: 'event', name: '이벤트 부스', description: '스탬프 랠리 최종 경품 교환', imageLabel: 'Event', className: boothCardClassNames[1] }
    ]
  }
}

export function DManageBooth() {
  const [selectedDay, setSelectedDay] = useState<DashboardDay>('Day 1')
  const currentDay = boothDayData[selectedDay]

  return (
    <AdminDashboardLayout activeSection="booth">
      <DashboardContent>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-[31px] font-bold leading-tight">부스 관리</h2>
          <DashboardDaySelector value={selectedDay} onChange={setSelectedDay} />
        </div>

        <section className="rounded-[10px] bg-white px-6 py-6 shadow-[7px_9px_30px_rgba(0,0,0,0.08)]">
          <h3 className="text-[21px] font-semibold">상태 요약</h3>
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {currentDay.summaryStats.map((stat) => (
              <DashboardMetricCard key={stat.label} {...stat} />
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-[10px] bg-white px-6 py-6 shadow-[7px_9px_30px_rgba(0,0,0,0.08)]">
          <h3 className="text-[21px] font-semibold">파일 업로드</h3>
          <div className="mt-4">
            <p className="flex items-center gap-2 text-[15px] font-semibold text-[#2f80ff]">
              <InfoIcon />
              업로드 규칙
            </p>
            <p className="mt-2 break-keep text-[14px] font-medium leading-relaxed text-[#4b5563]">
              CSV 파일과 이미지 폴더를 함께 업로드해 주세요.
              <br />
              파일명은 부스명 기준으로 정리합니다.
            </p>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[240px_1fr]">
            <section className="h-[173px] rounded-[10px] border border-[#e1e1e1] bg-white px-5 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
              <h4 className="text-[16px] font-semibold">파일 구조</h4>
              <div className="mt-3 rounded-[8px] bg-[#f8fafc] px-4 py-3 font-mono text-[12px] font-semibold leading-5 text-[#1f2937]">
                <p>booths.csv</p>
                <p>images/</p>
                <p className="pl-4 text-[#4b5563]">booth_001.jpg</p>
                <p className="pl-4 text-[#4b5563]">booth_002.jpg</p>
              </div>
            </section>

            <div>
              <label className="flex min-h-[173px] cursor-pointer flex-col items-center justify-center rounded-[10px] border border-dashed border-[#72a7ff] bg-[#f8fbff] px-6 text-center transition hover:border-[#2f80ff] hover:bg-[#f1f7ff]">
                <input className="sr-only" type="file" accept=".zip,application/zip" />
                <span className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#eaf2ff] text-[#2f80ff]">
                  <UploadIcon />
                </span>
                <span className="mt-4 text-[21px] font-semibold">ZIP 파일 선택</span>
                <span className="mt-3 text-[13px] font-medium text-[#6b7280]">
                  파일을 끌어오거나 클릭해서 업로드
                </span>
              </label>
              <button
                type="button"
                className="ml-auto mt-5 flex h-[46px] w-[150px] items-center justify-center rounded-[10px] bg-[#0097ce] text-[17px] font-semibold text-white shadow-[0_6px_16px_rgba(0,151,206,0.24)] transition hover:bg-[#0087b8]"
              >
                업로드
              </button>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[10px] bg-white px-6 py-6 shadow-[7px_9px_30px_rgba(0,0,0,0.08)]">
          <h3 className="text-[21px] font-semibold">부스 목록</h3>
          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            {currentDay.booths.map((booth) => (
              <article
                key={booth.id}
                className="overflow-hidden rounded-[10px] border border-[#e1e1e1] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.04)]"
              >
                <div
                  aria-label={`${booth.name} 이미지`}
                  className={`flex h-[190px] items-center justify-center bg-cover bg-center px-6 text-center text-[30px] font-bold tracking-[0.08em] text-[#ffd46b] ${booth.className}`}
                >
                  {booth.imageLabel}
                </div>
                <div className="flex items-center justify-between gap-4 px-6 py-5">
                  <div>
                    <h4 className="text-[21px] font-semibold">{booth.name}</h4>
                    <p className="mt-2 whitespace-pre-line text-[16px] font-medium leading-relaxed text-[#6b7280]">
                      {booth.description}
                    </p>
                  </div>
                  
                </div>
              </article>
            ))}
          </div>
        </section>
      </DashboardContent>
    </AdminDashboardLayout>
  )
}

function CalendarMetricIcon() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 4v3M18 4v3M4 8h16M5 6h14v14H5z" />
    </svg>
  )
}

function WarningMetricIcon() {
  return (
    <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#ffeceb] text-[#ff352e]">
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 4 3 20h18z" />
        <path d="M12 9v5M12 17h.01" />
      </svg>
    </span>
  )
}

function InfoIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 7.5v4M8 4.8h.01" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg className="h-9 w-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 16v4h14v-4" />
    </svg>
  )
}
