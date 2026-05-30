import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { getMyAdminProfile } from '../lib/adminApi'
import { getSubmittedAdminInfo } from '../lib/localState'
import type { AdminProfile } from '../types/api'

const steps = [
  '관리자 검토가 완료되면 승인 결과를 안내드립니다.',
  '승인 완료 시 관리자 VC가 발급되며, 계정이 활성화됩니다.',
  '활성화 후 대시보드에서 축제 생성을 진행할 수 있습니다.'
]
const AUTO_REDIRECT_DELAY_MS = 5000

const defaultAutoRedirect = (path: string) => window.location.assign(path)

export function WaitVC({
  onAutoRedirect = defaultAutoRedirect
}: {
  onAutoRedirect?: (path: string) => void
}) {
  const submittedAdminInfo = getSubmittedAdminInfo()
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const proofStatus = profile?.proofStatus ?? 'pending'
  const statusLabel =
    proofStatus === 'approved' ? '승인 완료' : proofStatus === 'rejected' ? '반려' : '승인 대기 중'
  const submittedInfo = [
    ['학교명', profile?.schoolName || submittedAdminInfo.schoolName],
    ['소속 기관', profile?.organizationName || submittedAdminInfo.organizationName],
    ['부서', profile?.department || submittedAdminInfo.department],
    ['직책', profile?.position || submittedAdminInfo.position],
    ['담당 역할', submittedAdminInfo.role],
    ['제출 자료', submittedAdminInfo.proofFileName]
  ]

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onAutoRedirect('/createFest')
    }, AUTO_REDIRECT_DELAY_MS)

    return () => window.clearTimeout(timeoutId)
  }, [onAutoRedirect])

  useEffect(() => {
    let isMounted = true

    getMyAdminProfile()
      .then((nextProfile) => {
        if (!isMounted) {
          return
        }

        setProfile(nextProfile)

        if (nextProfile?.proofStatus === 'approved') {
          onAutoRedirect('/createFest')
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : '관리자 승인 상태를 불러오지 못했습니다.')
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [onAutoRedirect])

  return (
    <main className="admin-page-shell">
      <h1 className="font-brand mx-auto text-center text-[42px] leading-none text-[#0097ce] sm:text-[49px]">
        CamPass
      </h1>

      <section
        aria-labelledby="wait-vc-title"
        className="admin-page-card mx-auto mt-6"
      >
        <header className="text-center">
          <h2
            id="wait-vc-title"
            className="break-keep text-[25px] font-bold leading-[1.45] tracking-normal sm:text-[31px]"
          >
            관리자 VC 발급 승인 대기
          </h2>
          <p className="mt-1 break-keep text-[15px] leading-relaxed text-[#313131]">
            승인 완료 시 관리자 VC가 발급되고 축제 생성 화면으로 이동합니다.
          </p>
          <p className="mt-2 break-keep text-[14px] font-bold leading-relaxed text-[#0097ce]">
            테스트 진행을 위해 5초 뒤 축제 생성 화면으로 이동합니다.
          </p>
        </header>

        <div className="mt-10 grid items-center gap-8 xl:grid-cols-[minmax(220px,300px)_1fr] xl:gap-12 2xl:mt-14 2xl:gap-[62px] 2xl:px-[40px]">
          <section className="flex flex-col items-center text-center" aria-label="제출 완료 상태">
            <h3 className="text-[31px] font-bold leading-none tracking-normal">제출 완료!</h3>
            <p className="mt-3 text-[18px] font-bold text-[#0097ce]">{statusLabel}</p>
            <div className="mt-6 flex h-32 w-32 items-center justify-center rounded-full bg-[#35e014] 2xl:mt-8 2xl:h-[166px] 2xl:w-[166px]">
              <span
                className="h-[58px] w-[94px] rotate-[-45deg] border-b-[20px] border-l-[20px] border-white"
                aria-hidden="true"
              />
            </div>
          </section>

          <section className="w-full max-w-[530px] rounded-[15px] border border-[#e0e0e0] bg-white px-6 py-6 2xl:min-h-[230px] 2xl:px-8 2xl:py-8">
            <h3 className="text-[31px] font-bold leading-none tracking-normal">제출 정보</h3>
            {isLoading ? (
              <p className="mt-5 text-[15px] font-semibold text-[#5f6b7a]">승인 상태를 확인하는 중입니다.</p>
            ) : null}
            {errorMessage ? (
              <p className="mt-5 break-keep text-[15px] font-semibold text-[#e24a4a]">{errorMessage}</p>
            ) : null}
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

        <div className="mt-10 grid gap-6 xl:grid-cols-2 xl:px-4 2xl:mt-16 2xl:gap-7 2xl:px-8">
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
