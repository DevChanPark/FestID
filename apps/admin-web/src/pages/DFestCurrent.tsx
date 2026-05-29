import { useState, type ReactNode } from 'react'

import {
  AdminDashboardLayout,
  BoothMetricIcon,
  CheckMetricIcon,
  ChevronDownIcon,
  DashboardDaySelector,
  DashboardContent,
  type DashboardDay,
  DashboardMetricCard,
  EntryMetricIcon,
  GroupMetricIcon
} from '../components/AdminDashboardLayout'

const dayStats: Record<DashboardDay, {
  metrics: Array<{ label: string; value: string; icon: ReactNode }>
  chartValues: number[]
}> = {
  'Day 1': {
    metrics: [
      { label: '전체 부스 방문수', value: '52', icon: <BoothMetricIcon /> },
      { label: '총 현장 입장 수', value: '214', icon: <EntryMetricIcon /> },
      { label: '전체 참여자 수', value: '1009', icon: <GroupMetricIcon /> },
      { label: '체험자 완료 수', value: '58', icon: <CheckMetricIcon /> }
    ],
    chartValues: [30, 52, 80, 122, 224, 176, 258, 320, 210]
  },
  'Day 2': {
    metrics: [
      { label: '전체 부스 방문수', value: '71', icon: <BoothMetricIcon /> },
      { label: '총 현장 입장 수', value: '286', icon: <EntryMetricIcon /> },
      { label: '전체 참여자 수', value: '1284', icon: <GroupMetricIcon /> },
      { label: '체험자 완료 수', value: '76', icon: <CheckMetricIcon /> }
    ],
    chartValues: [42, 64, 108, 146, 265, 212, 302, 340, 258]
  },
  'Day 3': {
    metrics: [
      { label: '전체 부스 방문수', value: '63', icon: <BoothMetricIcon /> },
      { label: '총 현장 입장 수', value: '241', icon: <EntryMetricIcon /> },
      { label: '전체 참여자 수', value: '1147', icon: <GroupMetricIcon /> },
      { label: '체험자 완료 수', value: '69', icon: <CheckMetricIcon /> }
    ],
    chartValues: [35, 58, 93, 136, 246, 188, 274, 306, 236]
  }
}

const chartLabels = ['00시', '03시', '06시', '09시', '12시', '15시', '18시', '21시', '24시']

export function DFestCurrent() {
  const [selectedDay, setSelectedDay] = useState<DashboardDay>('Day 1')
  const currentDay = dayStats[selectedDay]

  return (
    <AdminDashboardLayout activeSection="current">
      <DashboardContent>
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <h2 className="text-[31px] font-bold leading-tight">축제현황</h2>
            <span className="rounded-[10px] bg-[#ddf8eb] px-4 py-2 text-[17px] font-semibold text-[#28b36e]">
              진행중
            </span>
          </div>
          <DashboardDaySelector value={selectedDay} onChange={setSelectedDay} />
        </div>

        <section aria-label="축제 주요 지표" className="grid gap-4 xl:grid-cols-4">
          {currentDay.metrics.map((metric) => (
            <DashboardMetricCard key={metric.label} {...metric} />
          ))}
        </section>

        <section className="mt-8 rounded-[10px] bg-white px-6 py-5 shadow-[7px_9px_30px_rgba(0,0,0,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-[21px] font-semibold">시간대별 QR 인증 추이</h3>
            <button
              type="button"
              className="flex h-[44px] items-center gap-3 rounded-[10px] border border-[#e1e1e1] bg-white px-5 text-[14px] font-medium shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
            >
              QR Time
              <ChevronDownIcon />
            </button>
          </div>
          <LineChart values={currentDay.chartValues} />
        </section>
      </DashboardContent>
    </AdminDashboardLayout>
  )
}

function LineChart({ values }: { values: number[] }) {
  const chartTop = 35
  const chartHeight = 230
  const chartBottom = chartTop + chartHeight
  const chartLeft = 32
  const chartWidth = 810
  const chartStep = chartWidth / (values.length - 1)
  const chartPoints = values.map((value, index) => [
    chartLeft + index * chartStep,
    chartTop + ((350 - value) / 350) * chartHeight
  ])
  const path = chartPoints.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ')
  const area = `${path} L ${chartLeft + chartWidth} ${chartBottom} L ${chartLeft} ${chartBottom} Z`

  return (
    <div className="mt-4 overflow-x-auto">
      <svg
        aria-label="시간대별 QR 인증 추이 차트"
        className="h-[245px] w-full min-w-[840px] rounded-[10px]"
        viewBox="0 0 890 330"
        role="img"
      >
        <defs>
          <linearGradient id="qr-chart-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2f80ff" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#2f80ff" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[350, 300, 250, 200, 150, 100, 50, 0].map((label) => {
          const y = chartTop + ((350 - label) / 350) * chartHeight

          return (
            <g key={label}>
              <line x1={chartLeft} x2={chartLeft + chartWidth} y1={y} y2={y} stroke="#e4e8ef" strokeDasharray="4 4" />
              <text x="0" y={y + 5} fill="#4b5563" fontSize="14">
                {label}
              </text>
            </g>
          )
        })}
        <line x1={chartLeft} x2={chartLeft + chartWidth} y1={chartBottom} y2={chartBottom} stroke="#e4e8ef" />
        <path d={area} fill="url(#qr-chart-fill)" />
        <path d={path} fill="none" stroke="#2f80ff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
        {chartPoints.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="4.5" fill="white" stroke="#2f80ff" strokeWidth="2.5" />
        ))}
        {chartLabels.map((label, index) => (
          <text key={label} x={chartLeft + index * chartStep} y="302" fill="#313131" fontSize="14" textAnchor="middle">
            {label}
          </text>
        ))}
      </svg>
    </div>
  )
}
