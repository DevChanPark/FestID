import type { ReactNode } from 'react'
import { useEffect } from 'react'

const submittedInfo = [
  ['이름', '관리자'],
  ['연락처', 'admin@example.com'],
  ['직책', '총학생회'],
  ['소속 기관', '광운대학교'],
  ['제출 자료', '재학증명서.pdf']
]

const steps = [
  '관리자 검토가 완료되면 승인 결과를 안내드립니다.',
  '승인 완료 시 관리자 VC가 발급되며, 계정이 활성화됩니다.',
  '활성화 후 대시보드에서 축제 생성을 진행할 수 있습니다.'
]

export function WaitVC({
  onAutoRedirect = (path: string) => window.location.assign(path)
}: {
  onAutoRedirect?: (path: string) => void
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onAutoRedirect('/createFest')
    }, 5000)

    return () => window.clearTimeout(timer)
  }, [onAutoRedirect])

  return (
    <main className="min-h-screen bg-white px-5 py-8 font-sans text-[#1a1a1a] sm:py-10">
      <h1 className="font-brand mx-auto text-center text-[42px] leading-none text-[#0097ce] sm:text-[49px]">
        CamPass
      </h1>

      <section
        aria-labelledby="wait-vc-title"
        className="mx-auto mt-9 w-full max-w-[1076px] rounded-[30px] bg-white px-8 py-10 shadow-panel sm:px-14 lg:min-h-[765px] lg:rounded-[38px]"
      >
        <header className="text-center">
          <h2
            id="wait-vc-title"
            className="break-keep text-[25px] font-bold leading-[1.45] tracking-normal sm:text-[31px]"
          >
            관리자 VC 발급 승인 대기
          </h2>
          <p className="mt-1 break-keep text-[15px] leading-relaxed text-[#313131]">
            검토 완료 시 적어주신 연락처로 안내 결과 메일이 발송될 예정입니다.
          </p>
        </header>

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-[300px_1fr] lg:gap-[62px] lg:px-[40px]">
          <section className="flex flex-col items-center text-center" aria-label="제출 완료 상태">
            <h3 className="text-[31px] font-bold leading-none tracking-normal">제출 완료!</h3>
            <div className="mt-8 flex h-[166px] w-[166px] items-center justify-center rounded-full bg-[#35e014]">
              <span
                className="h-[58px] w-[94px] rotate-[-45deg] border-b-[20px] border-l-[20px] border-white"
                aria-hidden="true"
              />
            </div>
          </section>

          <section className="rounded-[15px] border border-[#e0e0e0] bg-white px-8 py-8 lg:min-h-[230px] lg:w-[530px]">
            <h3 className="text-[31px] font-bold leading-none tracking-normal">제출 정보</h3>
            <dl className="mt-8 grid gap-y-5 text-[15px] font-bold leading-5 sm:grid-cols-2">
              {submittedInfo.map(([label, value]) => (
                <div key={label} className="flex">
                  <dt>{label} :</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <div className="mt-16 grid gap-7 lg:grid-cols-2 lg:px-8">
          <InfoCard
            icon={<ClockIcon />}
            title="예상 처리 시간"
            subtitle="1~3 영업일"
            lines={['현재 평균 처리 시간 기준', '검토 상황에 따라 변동될 수 있습니다.']}
          />
          <InfoCard
            icon={<PaperPlaneIcon />}
            title="다음 단계"
            lines={steps}
            ordered
          />
        </div>
      </section>
    </main>
  )
}

function InfoCard({
  icon,
  title,
  subtitle,
  lines,
  ordered = false
}: {
  icon: ReactNode
  title: string
  subtitle?: string
  lines: string[]
  ordered?: boolean
}) {
  return (
    <section className="flex min-h-[162px] flex-col rounded-[15px] border border-[#e0e0e0] bg-white px-6 py-6">
      <header className="flex items-center gap-5">
        {icon}
        <h3 className="text-[19px] font-bold">{title}</h3>
      </header>

      <div className="pl-[10px]">
        {subtitle ? <p className="mt-7 text-[22px] font-bold">{subtitle}</p> : null}
        {ordered ? (
          <ol className="mt-5 space-y-3 text-[15px] font-semibold leading-relaxed text-[#5f6b7a]">
            {lines.map((line, index) => (
              <li key={line} className="flex gap-3">
                <span className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-[#8a9ab2] text-[13px] font-bold text-white">
                  {index + 1}
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ol>
        ) : (
          <div className="mt-4 space-y-2 text-[15px] font-semibold leading-relaxed text-[#5f6b7a]">
            {lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function ClockIcon() {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef4ff] text-[#6f8ab2]" aria-hidden="true">
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7v5l4 2" />
      </svg>
    </span>
  )
}

function PaperPlaneIcon() {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef4ff] text-[#7e9dd2]" aria-hidden="true">
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12 20 5l-6 14-3-6-7-1Z" />
        <path d="m11 13 4-4" />
      </svg>
    </span>
  )
}
