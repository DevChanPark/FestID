import { useEffect, useState, type ReactNode } from 'react'

import {
  AdminDashboardLayout,
  ChevronDownIcon,
  DashboardDaySelector,
  DashboardContent,
  type DashboardDay
} from '../components/AdminDashboardLayout'
import { getReportSummary, listScanReports, listUsageReports } from '../lib/adminApi'
import { resolveActiveFestival } from '../lib/activeFestival'
import type { ReportSummary, ScanReport, UsageReport } from '../types/api'

const metricCards = [
  { label: '총 방문자 수', value: '1,009', tone: 'blue', icon: <UsersIcon /> },
  { label: '현장 입장 수', value: '214', tone: 'green', icon: <WalkIcon /> },
  { label: 'QR 인증 수', value: '326', tone: 'purple', icon: <QrGridIcon /> },
  { label: '부스 참여율', value: '64%', tone: 'amber', icon: <ChartIcon /> }
]

const reportSummary = [
  { text: '오전 대비 오후 방문 28% 증가', tone: 'green', icon: <ArrowUpIcon /> },
  { text: '푸드 부스 참여율 가장 높음', tone: 'amber', icon: <StarIcon /> },
  { text: '대기 시간 평균 4분 20초', tone: 'blue', icon: <ClockSmallIcon /> },
  { text: '오류 항목 2건 확인 필요', tone: 'red', icon: <AlertSmallIcon /> }
]

const topBooths = [
  { name: '푸드트럭 존', value: 328, percent: '32.5%', width: '100%' },
  { name: '체험존 A', value: 214, percent: '21.2%', width: '66%' },
  { name: '굿즈 스토어', value: 187, percent: '18.5%', width: '56%' },
  { name: '포토존', value: 156, percent: '15.5%', width: '45%' },
  { name: '이벤트 부스', value: 124, percent: '12.3%', width: '34%' }
]

const participationTypes = [
  { label: '주점', value: '38%', count: '383', color: '#2f80ff' },
  { label: '체험', value: '32%', count: '323', color: '#45c58b' },
  { label: '이벤트', value: '20%', count: '202', color: '#ff9f1c' },
  { label: '기타', value: '10%', count: '101', color: '#9b5de5' }
]

const anomalyRows = [
  { item: 'QR 중복 인증', location: '게이트 A', time: '14:35' },
  { item: '입장 지연 발생', location: '게이트 B', time: '15:02' }
]
const reportDays = ['Day 1', 'Day 2', 'Day 3']

const reportDayData: Record<DashboardDay, {
  metricCards: typeof metricCards
  anomalyRows: typeof anomalyRows
  entryValues: number[]
  qrValues: number[]
}> = {
  'Day 1': {
    metricCards,
    anomalyRows,
    entryValues: [10, 22, 42, 72, 78, 82, 132, 118, 88, 150, 170, 145, 118],
    qrValues: [4, 12, 22, 42, 52, 48, 88, 75, 50, 100, 128, 98, 72]
  },
  'Day 2': {
    metricCards: [
      { label: '총 방문자 수', value: '1,284', tone: 'blue', icon: <UsersIcon /> },
      { label: '현장 입장 수', value: '286', tone: 'green', icon: <WalkIcon /> },
      { label: 'QR 인증 수', value: '402', tone: 'purple', icon: <QrGridIcon /> },
      { label: '부스 참여율', value: '71%', tone: 'amber', icon: <ChartIcon /> }
    ],
    anomalyRows: [
      { item: '입장 지연 발생', location: '게이트 C', time: '13:25' },
      { item: 'QR 재시도 증가', location: '체험존 A', time: '16:40' }
    ],
    entryValues: [18, 30, 58, 86, 96, 110, 155, 142, 112, 168, 194, 172, 136],
    qrValues: [8, 16, 32, 54, 66, 70, 105, 94, 68, 120, 146, 118, 84]
  },
  'Day 3': {
    metricCards: [
      { label: '총 방문자 수', value: '1,147', tone: 'blue', icon: <UsersIcon /> },
      { label: '현장 입장 수', value: '241', tone: 'green', icon: <WalkIcon /> },
      { label: 'QR 인증 수', value: '358', tone: 'purple', icon: <QrGridIcon /> },
      { label: '부스 참여율', value: '68%', tone: 'amber', icon: <ChartIcon /> }
    ],
    anomalyRows: [
      { item: '대기열 집중', location: '포토존', time: '17:10' },
      { item: '마감 스캔 증가', location: '이벤트 부스', time: '20:20' }
    ],
    entryValues: [12, 24, 48, 74, 84, 88, 126, 122, 96, 158, 182, 164, 130],
    qrValues: [5, 14, 26, 46, 56, 52, 92, 82, 58, 106, 134, 110, 80]
  }
}

export function DReport() {
  const [selectedDashboardDay, setSelectedDashboardDay] = useState<DashboardDay>('Day 1')
  const [selectedDays, setSelectedDays] = useState(['Day 1'])
  const [isDayDropdownOpen, setIsDayDropdownOpen] = useState(false)
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [scans, setScans] = useState<ScanReport[]>([])
  const [usage, setUsage] = useState<UsageReport[]>([])
  const [statusMessage, setStatusMessage] = useState('')
  const fallbackDay = reportDayData[selectedDashboardDay]
  const currentDay = {
    ...fallbackDay,
    metricCards: summary ? buildReportMetrics(summary) : fallbackDay.metricCards,
    anomalyRows: scans.length > 0 ? buildAnomalyRows(scans) : fallbackDay.anomalyRows,
    entryValues: summary?.hourlyScanCount?.length ? hourlyValues(summary.hourlyScanCount) : fallbackDay.entryValues,
    qrValues: summary?.hourlyScanCount?.length ? hourlyValues(summary.hourlyScanCount, 0.8) : fallbackDay.qrValues
  }
  const displayedTopBooths = summary?.boothUsage?.length ? buildTopBooths(summary.boothUsage) : topBooths
  const displayedParticipationTypes = summary?.usageTypeCount?.length
    ? buildParticipationTypes(summary.usageTypeCount)
    : participationTypes
  const totalParticipation = usage.length || Number(summary?.boothUsageCount ?? 0) + Number(summary?.eventParticipationCount ?? 0) || 1009
  const selectedDayLabel = selectedDays.length === reportDays.length
    ? 'Day 1 ~ Day 3'
    : selectedDays.join(', ')

  useEffect(() => {
    let ignore = false

    resolveActiveFestival()
      .then(async ({ festivalId }) => {
        const [nextSummary, nextScans, nextUsage] = await Promise.all([
          getReportSummary(festivalId),
          listScanReports(festivalId, { limit: 50 }),
          listUsageReports(festivalId, { limit: 50 })
        ])

        if (!ignore) {
          setSummary(nextSummary)
          setScans(nextScans)
          setUsage(nextUsage)
          setStatusMessage('백엔드 운영 리포트를 불러왔습니다.')
        }
      })
      .catch((error) => {
        if (!ignore) {
          setStatusMessage(error instanceof Error ? error.message : '운영 리포트를 불러오지 못했습니다.')
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  const toggleDay = (day: string) => {
    setSelectedDays((current) => {
      if (current.includes(day)) {
        return current.length === 1 ? current : current.filter((selectedDay) => selectedDay !== day)
      }

      return [...current, day].sort((a, b) => reportDays.indexOf(a) - reportDays.indexOf(b))
    })
  }

  return (
    <AdminDashboardLayout activeSection="report">
      <DashboardContent>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-[31px] font-bold leading-tight">운영 리포트</h2>
            {statusMessage ? (
              <p className="mt-2 break-keep text-[14px] font-semibold text-[#5b6775]">{statusMessage}</p>
            ) : null}
          </div>
          <DashboardDaySelector value={selectedDashboardDay} onChange={setSelectedDashboardDay} />
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {currentDay.metricCards.map((metric) => (
            <ReportMetricCard key={metric.label} {...metric} />
          ))}
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
          <article className="rounded-[10px] border border-[#e1e1e1] bg-white px-5 py-5 shadow-[0_4px_18px_rgba(0,0,0,0.04)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h3 className="text-[20px] font-semibold">시간대별 방문 추이</h3>
              <div className="flex items-center gap-5 text-[13px] font-medium text-[#454545]">
                <LegendItem label="입장" tone="solid" />
                <LegendItem label="QR 인증" tone="dashed" />
              </div>
            </div>
            <VisitTrendChart entryValues={currentDay.entryValues} qrValues={currentDay.qrValues} />
          </article>

          <article className="rounded-[10px] border border-[#e1e1e1] bg-white px-5 py-5 shadow-[0_4px_18px_rgba(0,0,0,0.04)]">
            <h3 className="text-[20px] font-semibold">운영 요약</h3>
            <div className="mt-4 space-y-2">
              {reportSummary.map((item) => (
                <SummaryRow key={item.text} {...item} />
              ))}
            </div>
          </article>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_1fr]">
          <article className="rounded-[10px] border border-[#e1e1e1] bg-white px-5 py-5 shadow-[0_4px_18px_rgba(0,0,0,0.04)]">
            <h3 className="text-[20px] font-semibold">인기 부스 TOP 5</h3>
            <div className="mt-5 space-y-3">
              {displayedTopBooths.map((booth, index) => (
                <div key={booth.name} className="grid grid-cols-[150px_1fr_86px] items-center gap-4 text-[14px] max-sm:grid-cols-1 max-sm:gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2f80ff] text-[12px] font-bold text-white">
                      {index + 1}
                    </span>
                    <span className="truncate font-semibold text-[#313131]">{booth.name}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#e9eef7]">
                    <div className="h-full rounded-full bg-[#2f80ff]" style={{ width: booth.width }} />
                  </div>
                  <p className="text-right font-semibold text-[#313131] max-sm:text-left">
                    {booth.value} <span className="font-medium text-[#7a7a7a]">({booth.percent})</span>
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[10px] border border-[#e1e1e1] bg-white px-5 py-5 shadow-[0_4px_18px_rgba(0,0,0,0.04)]">
            <h3 className="text-[20px] font-semibold">참여 유형 분포</h3>
            <div className="mt-4 grid items-center gap-5 md:grid-cols-[210px_1fr]">
              <DonutChart total={totalParticipation} />
              <div className="space-y-4">
                {displayedParticipationTypes.map((item) => (
                  <div key={item.label} className="grid grid-cols-[1fr_auto] items-center gap-4 text-[15px]">
                    <div className="flex items-center gap-3 font-semibold text-[#313131]">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.label}
                    </div>
                    <p className="font-bold">
                      {item.value} <span className="font-medium text-[#777]">({item.count})</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_1fr]">
          <article className="rounded-[10px] border border-[#e1e1e1] bg-white px-5 py-5 shadow-[0_4px_18px_rgba(0,0,0,0.04)]">
            <h3 className="text-[20px] font-semibold">이상 징후 목록</h3>
            <div className="mt-4 overflow-hidden rounded-[10px] border border-[#e1e1e1]">
              <table className="w-full min-w-[480px] text-left text-[14px]">
                <thead className="bg-[#f8fafc] text-[#4b5563]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">항목</th>
                    <th className="px-4 py-3 font-semibold">위치</th>
                    <th className="px-4 py-3 font-semibold">발생 시간</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e1e1e1]">
                  {currentDay.anomalyRows.map((row) => (
                    <tr key={`${row.item}-${row.time}`}>
                      <td className="px-4 py-3 font-semibold">
                        <span className="mr-2 inline-flex align-middle text-[#ff3b30]">
                          <AlertSmallIcon />
                        </span>
                        {row.item}
                      </td>
                      <td className="px-4 py-3 text-[#4b5563]">{row.location}</td>
                      <td className="px-4 py-3 font-semibold text-[#313131]">{row.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-[10px] border border-[#e1e1e1] bg-white px-5 py-5 shadow-[0_4px_18px_rgba(0,0,0,0.04)]">
            <h3 className="text-[20px] font-semibold">리포트 내보내기</h3>
            <div className="mt-6 space-y-5">
              <label className="relative grid gap-3 text-[15px] font-semibold">
                Day 선택
                <button
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={isDayDropdownOpen}
                  onClick={() => setIsDayDropdownOpen((open) => !open)}
                  className="flex h-[52px] items-center justify-between rounded-[10px] border border-[#e1e1e1] bg-white px-4 text-left text-[15px] font-medium text-[#313131]"
                >
                  <span className="flex items-center gap-3">
                    <CalendarIcon />
                    {selectedDayLabel}
                  </span>
                  <ChevronDownIcon />
                </button>
                {isDayDropdownOpen ? (
                  <div
                    role="listbox"
                    aria-label="리포트 Day 선택"
                    className="absolute left-0 right-0 top-[82px] z-20 rounded-[10px] border border-[#e1e1e1] bg-white py-2 shadow-[0_10px_24px_rgba(0,0,0,0.12)]"
                  >
                    {reportDays.map((day) => (
                      <button
                        key={day}
                        type="button"
                        role="option"
                        aria-selected={selectedDays.includes(day)}
                        onClick={() => toggleDay(day)}
                        className="flex w-full items-center justify-between px-4 py-2 text-left text-[15px] font-semibold text-[#313131] hover:bg-[#f5f8ff]"
                      >
                        {day}
                        <span className={`flex h-5 w-5 items-center justify-center rounded-[5px] border text-[12px] ${
                          selectedDays.includes(day)
                            ? 'border-[#2f80ff] bg-[#2f80ff] text-white'
                            : 'border-[#d1d5db] text-transparent'
                        }`}>
                          ✓
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </label>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-[15px] font-semibold">리포트 형식</span>
                  <FormatButton label="PDF" tone="red" />
                  <FormatButton label="CSV" tone="green" />
                </div>
                <button
                  type="button"
                  className="flex h-[46px] min-w-[150px] items-center justify-center gap-2 rounded-[8px] bg-[#0b74f6] px-5 text-[16px] font-semibold text-white shadow-[0_4px_12px_rgba(11,116,246,0.25)]"
                >
                  <DownloadIcon />
                  다운로드
                </button>
              </div>
            </div>
          </article>
        </section>
      </DashboardContent>
    </AdminDashboardLayout>
  )
}

function buildReportMetrics(summary: ReportSummary) {
  return [
    { label: '총 방문자 수', value: String(summary.totalPassIssuedCount ?? 0), tone: 'blue', icon: <UsersIcon /> },
    { label: '현장 입장 수', value: String(summary.entryProcessedCount ?? 0), tone: 'green', icon: <WalkIcon /> },
    { label: 'QR 인증 수', value: String(totalScanCount(summary)), tone: 'purple', icon: <QrGridIcon /> },
    { label: '부스 참여율', value: `${participationRate(summary)}%`, tone: 'amber', icon: <ChartIcon /> }
  ]
}

function totalScanCount(summary: ReportSummary) {
  return summary.scanResultCount?.reduce((total, item) => total + item.count, 0) ?? summary.totalScans ?? 0
}

function participationRate(summary: ReportSummary) {
  const totalPasses = Number(summary.totalPassIssuedCount ?? 0)
  const participations = Number(summary.boothUsageCount ?? 0) + Number(summary.eventParticipationCount ?? 0)

  if (totalPasses <= 0) {
    return 0
  }

  return Math.min(100, Math.round((participations / totalPasses) * 100))
}

function buildAnomalyRows(scans: ScanReport[]) {
  const deniedScans = scans.filter((scan) => scan.result && scan.result !== 'allowed')

  return (deniedScans.length > 0 ? deniedScans : scans.slice(0, 2)).slice(0, 5).map((scan) => ({
    item: resultLabel(scan.result),
    location: scan.boothId || scan.scanPurpose || '-',
    time: formatTime(scan.createdAt)
  }))
}

function buildTopBooths(boothUsage: NonNullable<ReportSummary['boothUsage']>) {
  const max = Math.max(...boothUsage.map((item) => item.count), 1)
  const total = boothUsage.reduce((sum, item) => sum + item.count, 0) || 1

  return boothUsage.slice(0, 5).map((item) => ({
    name: item.booth?.name || item.boothId || '부스',
    value: item.count,
    percent: `${Math.round((item.count / total) * 1000) / 10}%`,
    width: `${Math.max(8, Math.round((item.count / max) * 100))}%`
  }))
}

function buildParticipationTypes(items: NonNullable<ReportSummary['usageTypeCount']>) {
  const colors = ['#2f80ff', '#45c58b', '#ff9f1c', '#9b5de5']
  const total = items.reduce((sum, item) => sum + item.count, 0) || 1

  return items.slice(0, 4).map((item, index) => ({
    label: usageTypeLabel(item.usageType),
    value: `${Math.round((item.count / total) * 100)}%`,
    count: String(item.count),
    color: colors[index % colors.length]
  }))
}

function hourlyValues(items: NonNullable<ReportSummary['hourlyScanCount']>, ratio = 1) {
  const values = items.slice(-13).map((item) => Math.round(item.count * ratio))
  return values.length > 1 ? values : [0, ...values, 0]
}

function resultLabel(result: string | undefined) {
  const labels: Record<string, string> = {
    allowed: '허용된 QR 스캔',
    denied: 'QR 거절',
    expired: '만료된 QR',
    already_used: 'QR 중복 인증',
    missing_credential: '권한 VC 없음',
    invalid_qr: '유효하지 않은 QR',
    missing_staff_scope: '스태프 scope 부족'
  }

  return labels[result ?? ''] ?? 'QR 스캔'
}

function usageTypeLabel(usageType: string) {
  const labels: Record<string, string> = {
    entry: '입장',
    benefit: '혜택',
    event: '이벤트',
    adult_check: '성인 확인',
    student_check: '재학생 확인'
  }

  return labels[usageType] ?? usageType
}

function formatTime(value: string | undefined) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

function ReportMetricCard({
  label,
  value,
  tone,
  icon
}: {
  label: string
  value: string
  tone: string
  icon: ReactNode
}) {
  const toneClass =
    {
      blue: 'bg-[#eaf2ff] text-[#2f80ff]',
      green: 'bg-[#dcf8e9] text-[#23b26d]',
      purple: 'bg-[#f0dcff] text-[#9b5de5]',
      amber: 'bg-[#fff0d5] text-[#ff9f1c]'
    }[tone] ?? 'bg-[#eaf2ff] text-[#2f80ff]'

  return (
    <article className="flex min-h-[108px] items-center gap-4 rounded-[10px] border border-[#e1e1e1] bg-white px-5 shadow-[0_4px_18px_rgba(0,0,0,0.04)]">
      <span className={`flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full ${toneClass}`}>
        {icon}
      </span>
      <div>
        <p className="text-[15px] font-semibold text-[#454545]">{label}</p>
        <p className="mt-1 text-[30px] font-bold leading-none">{value}</p>
      </div>
    </article>
  )
}

function VisitTrendChart({ entryValues, qrValues }: { entryValues: number[]; qrValues: number[] }) {
  const labels = ['08시', '09시', '10시', '11시', '12시', '13시', '14시', '15시', '17시', '18시', '19시', '20시', '21시']
  const width = 720
  const height = 245
  const left = 42
  const top = 24
  const chartWidth = 640
  const chartHeight = 150
  const max = 200
  const x = (index: number) => left + (chartWidth / (labels.length - 1)) * index
  const y = (value: number) => top + chartHeight - (value / max) * chartHeight
  const entryPath = entryValues.map((value, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(value)}`).join(' ')
  const qrPath = qrValues.map((value, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(value)}`).join(' ')

  return (
    <div className="mt-4 overflow-x-auto">
      <svg aria-label="시간대별 방문 추이 차트" className="h-[245px] w-full min-w-[680px]" viewBox={`0 0 ${width} ${height}`}>
        {[0, 50, 100, 150, 200].map((tick) => (
          <g key={tick}>
            <line x1={left} x2={left + chartWidth} y1={y(tick)} y2={y(tick)} stroke="#e5e7eb" />
            <text x="8" y={y(tick) + 5} fill="#64748b" fontSize="13">
              {tick}
            </text>
          </g>
        ))}
        <path d={entryPath} fill="none" stroke="#2f80ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d={qrPath} fill="none" stroke="#2f80ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="8 8" opacity="0.9" />
        {entryValues.map((value, index) => (
          <circle key={`entry-${labels[index]}`} cx={x(index)} cy={y(value)} r="5" fill="#fff" stroke="#2f80ff" strokeWidth="3" />
        ))}
        {qrValues.map((value, index) => (
          <circle key={`qr-${labels[index]}`} cx={x(index)} cy={y(value)} r="4" fill="#2f80ff" />
        ))}
        {labels.map((label, index) => (
          <text key={label} x={x(index)} y={top + chartHeight + 28} textAnchor="middle" fill="#313131" fontSize="13">
            {label}
          </text>
        ))}
      </svg>
    </div>
  )
}

function DonutChart({ total }: { total: number }) {
  return (
    <div className="relative mx-auto h-[200px] w-[200px]">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-label="참여 유형 분포 차트">
        <circle cx="60" cy="60" r="42" fill="none" stroke="#2f80ff" strokeWidth="22" strokeDasharray="105 264" strokeDashoffset="0" />
        <circle cx="60" cy="60" r="42" fill="none" stroke="#45c58b" strokeWidth="22" strokeDasharray="88 264" strokeDashoffset="-108" />
        <circle cx="60" cy="60" r="42" fill="none" stroke="#ff9f1c" strokeWidth="22" strokeDasharray="55 264" strokeDashoffset="-199" />
        <circle cx="60" cy="60" r="42" fill="none" stroke="#9b5de5" strokeWidth="22" strokeDasharray="26 264" strokeDashoffset="-257" />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <p className="text-[15px] font-semibold text-[#454545]">
          총 참여
          <span className="mt-1 block text-[22px] font-bold text-[#1a1a1a]">{total.toLocaleString()}</span>
        </p>
      </div>
    </div>
  )
}

function SummaryRow({ text, tone, icon }: { text: string; tone: string; icon: ReactNode }) {
  const toneClass =
    {
      green: 'text-[#23b26d]',
      amber: 'text-[#ff9f1c]',
      blue: 'text-[#2f80ff]',
      red: 'text-[#ff3b30]'
    }[tone] ?? 'text-[#2f80ff]'

  return (
    <div className="flex min-h-[42px] items-center gap-3 rounded-[8px] border border-[#e1e1e1] px-3 text-[15px] font-semibold text-[#313131]">
      <span className={toneClass}>{icon}</span>
      {text}
    </div>
  )
}

function LegendItem({ label, tone }: { label: string; tone: 'solid' | 'dashed' }) {
  return (
    <span className="flex items-center gap-2">
      <span className={tone === 'solid' ? 'h-[3px] w-7 rounded-full bg-[#2f80ff]' : 'h-[3px] w-7 rounded-full border-t-[3px] border-dashed border-[#2f80ff]'} />
      {label}
    </span>
  )
}

function FormatButton({ label, tone }: { label: string; tone: 'red' | 'green' }) {
  const toneClass = tone === 'red' ? 'text-[#ff3b30]' : 'text-[#178f43]'
  return (
    <button type="button" className="flex h-[40px] min-w-[92px] items-center justify-center gap-2 rounded-[8px] border border-[#d8d8d8] bg-white text-[15px] font-semibold">
      <span className={toneClass}>
        <FileIcon />
      </span>
      {label}
    </button>
  )
}

function UsersIcon() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M3.8 19c.8-3.5 2.7-5.2 5.2-5.2s4.4 1.7 5.2 5.2" />
      <path d="M13.8 14.4c2.7.2 4.5 1.7 5.4 4.6" />
    </svg>
  )
}

function WalkIcon() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="5" r="2" />
      <path d="M10.5 20 12 13l-3-2" />
      <path d="m13 10 2.5 2.5" />
      <path d="M12 13h4" />
      <path d="m7 20 3.5-7" />
    </svg>
  )
}

function QrGridIcon() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" aria-hidden="true">
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" />
      <path d="M15 15h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="m7 15 4-4 3 3 5-7" />
    </svg>
  )
}

function ArrowUpIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 16V4" />
      <path d="m5 9 5-5 5 5" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="m10 2.8 2.1 4.3 4.8.7-3.5 3.4.8 4.8-4.2-2.3L5.8 16l.8-4.8-3.5-3.4 4.8-.7z" />
    </svg>
  )
}

function ClockSmallIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6v4l3 2" />
    </svg>
  )
}

function AlertSmallIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M10 2 19 18H1z" />
      <path d="M10 7v5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="10" cy="15" r="1" fill="#fff" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg className="h-5 w-5 text-[#4b5563]" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 2v4M15 2v4M3 8h14M4 4h12a1 1 0 0 1 1 1v12H3V5a1 1 0 0 1 1-1Z" />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 2h7l3 3v13H5z" />
      <path d="M12 2v4h4" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 3v10" />
      <path d="m6 9 4 4 4-4" />
      <path d="M4 17h12" />
    </svg>
  )
}
