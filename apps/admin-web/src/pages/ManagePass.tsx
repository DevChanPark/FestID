import { useEffect, useState } from 'react'
import { FestStepProgress } from '../components/FestStepProgress'
import { listPassTemplates } from '../lib/adminApi'
import { resolveActiveFestival } from '../lib/activeFestival'
import type { PassTemplate } from '../types/api'

const passTypes = [
  { label: '재학생 패스', value: 'student' },
  { label: '외부인 패스', value: 'entry' },
  { label: '스태프 패스', value: 'staff' }
]

export function ManagePass() {
  const [templates, setTemplates] = useState<PassTemplate[]>([])
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let ignore = false

    resolveActiveFestival()
      .then(({ festivalId }) => listPassTemplates(festivalId))
      .then((items) => {
        if (!ignore) {
          setTemplates(items)
          setLoadError('')
        }
      })
      .catch((error) => {
        if (!ignore) {
          setLoadError(error instanceof Error ? error.message : '패스 템플릿을 불러오지 못했습니다.')
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  const enabledTemplateCount = templates.filter((template) => template.enabled !== false).length

  return (
    <main className="min-h-screen bg-white px-5 py-8 font-sans text-[#1a1a1a] sm:py-10">
      <h1 className="font-brand mx-auto text-center text-[42px] leading-none text-[#0097ce] sm:text-[49px]">
        CamPass
      </h1>

      <section
        aria-labelledby="manage-pass-title"
        className="mx-auto mt-9 w-full max-w-[1076px] rounded-[30px] bg-white px-8 py-10 shadow-panel sm:px-14 lg:min-h-[765px] lg:rounded-[38px]"
      >
        <header>
          <h2
            id="manage-pass-title"
            className="break-keep text-[25px] font-bold leading-[1.45] tracking-normal sm:text-[31px]"
          >
            새 축제 생성
          </h2>
          <p className="mt-1 break-keep text-[15px] leading-relaxed text-[#313131]">
            관리할 축제를 생성합니다.
          </p>
        </header>

        <FestStepProgress activeStep={2} />

        <section className="mt-7">
          <h3 className="break-keep text-[25px] font-bold leading-[1.45] tracking-normal sm:text-[31px]">
            패스 템플릿 설정
          </h3>
          <p className="mt-1 break-keep text-[15px] leading-relaxed text-[#313131]">
            패스 발급 조건들을 설정해주세요.
          </p>
          <p className="mt-2 text-[14px] font-semibold text-[#5b6775]">
            백엔드에 저장된 활성 패스 템플릿 {enabledTemplateCount}개
            {loadError ? ` · ${loadError}` : ''}
          </p>

          <div className="mt-2 rounded-[15px] border border-[#e0e0e0] px-7 py-11 sm:px-10">
            <div className="grid gap-8 lg:grid-cols-3">
              {passTypes.map((passType) => {
                const template = templates.find((item) => item.type === passType.value)

                return (
                  <a
                    href={`/setPass?pass=${passType.value}`}
                    key={passType.value}
                    className="group relative block h-[186px] rounded-[15px] bg-[#0097ce] p-5 text-left text-white transition hover:bg-[#0087b8] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#0097ce]/40"
                  >
                    <span className="text-[17px] font-medium">{passType.label}</span>
                    <span className="mt-3 block text-[13px] font-semibold text-white/85">
                      {template ? (template.enabled === false ? '비활성' : '활성') : '미설정'}
                    </span>
                    <SettingsIcon />
                  </a>
                )
              })}
            </div>
          </div>
        </section>

        <div className="mx-auto mt-8 grid w-full max-w-[627px] gap-4 sm:grid-cols-2 sm:gap-[23px]">
          <a
            href="/createFest"
            className="flex h-12 items-center justify-center rounded-[15px] bg-[#0097ce] px-8 text-[17px] font-medium text-white transition hover:bg-[#0087b8] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#0097ce]/40"
          >
            축제 정보 수정하기
          </a>
          <a
            href="/dFestCurrent"
            className="flex h-12 items-center justify-center rounded-[15px] bg-[#0097ce] px-8 text-[17px] font-medium text-white transition hover:bg-[#0087b8] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#0097ce]/40"
          >
            축제 생성하기
          </a>
        </div>
      </section>
    </main>
  )
}

function SettingsIcon() {
  return (
    <svg
      className="absolute bottom-5 right-5 h-10 w-10 text-white"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 15.25A3.25 3.25 0 1 0 12 8.75a3.25 3.25 0 0 0 0 6.5Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.05.05a2.05 2.05 0 0 1-2.9 2.9l-.05-.05A1.7 1.7 0 0 0 15 19.43a1.7 1.7 0 0 0-1 .92l-.03.08a2.05 2.05 0 0 1-3.78 0l-.03-.08a1.7 1.7 0 0 0-1-.92 1.7 1.7 0 0 0-1.87.34l-.05.05a2.05 2.05 0 0 1-2.9-2.9l.05-.05A1.7 1.7 0 0 0 4.73 15a1.7 1.7 0 0 0-.92-1l-.08-.03a2.05 2.05 0 0 1 0-3.78l.08-.03a1.7 1.7 0 0 0 .92-1 1.7 1.7 0 0 0-.34-1.87l-.05-.05a2.05 2.05 0 0 1 2.9-2.9l.05.05A1.7 1.7 0 0 0 9.16 4.7a1.7 1.7 0 0 0 1-.92l.03-.08a2.05 2.05 0 0 1 3.78 0l.03.08a1.7 1.7 0 0 0 1 .92 1.7 1.7 0 0 0 1.87-.34l.05-.05a2.05 2.05 0 0 1 2.9 2.9l-.05.05A1.7 1.7 0 0 0 19.43 9c.22.41.55.74 1 .92l.08.03a2.05 2.05 0 0 1 0 3.78l-.08.03a1.7 1.7 0 0 0-1.03 1.24Z" />
    </svg>
  )
}
