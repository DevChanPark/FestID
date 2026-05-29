import { useState } from 'react'

const passTemplates = {
  student: {
    title: '재학생 패스',
    conditions: [
      { label: '휴학 여부', enabled: true },
      { label: '졸업 여부', enabled: false },
      { label: '증명 서류 형식 제한', enabled: true },
      { label: '성인 인증 여부', enabled: false }
    ]
  },
  guest: {
    title: '외부인 패스',
    conditions: [
      { label: '성인 인증 여부', enabled: false },
      { label: '초대 여부', enabled: false }
    ]
  },
  staff: {
    title: '스태프 패스',
    conditions: [
      { label: '재학 여부', enabled: true },
      { label: '증명 서류 형식 제한', enabled: true }
    ]
  }
}

type PassType = keyof typeof passTemplates

function getSelectedPassType(): PassType {
  if (typeof window === 'undefined') {
    return 'student'
  }

  const passType = new URLSearchParams(window.location.search).get('pass')
  return passType === 'guest' || passType === 'staff' ? passType : 'student'
}

export function SetPass() {
  const selectedPassType = getSelectedPassType()
  const selectedPass = passTemplates[selectedPassType]
  const [conditions, setConditions] = useState(selectedPass.conditions)

  const toggleCondition = (label: string) => {
    setConditions((currentConditions) =>
      currentConditions.map((condition) =>
        condition.label === label ? { ...condition, enabled: !condition.enabled } : condition
      )
    )
  }

  return (
    <main className="min-h-screen bg-white px-5 py-8 font-sans text-[#1a1a1a] sm:py-10">
      <h1 className="font-brand mx-auto text-center text-[42px] leading-none text-[#0097ce] sm:text-[49px]">
        CamPass
      </h1>

      <section
        aria-labelledby="set-pass-title"
        className="mx-auto mt-9 w-full max-w-[1076px] rounded-[30px] bg-white px-8 py-10 shadow-panel sm:px-14 lg:min-h-[765px] lg:rounded-[38px]"
      >
        <header className="text-center">
          <h2
            id="set-pass-title"
            className="break-keep text-[25px] font-bold leading-[1.45] tracking-normal sm:text-[31px]"
          >
            패스 설정 관리
          </h2>
          <p className="mt-1 break-keep text-[15px] leading-relaxed text-[#313131]">
            패스 설정을 수정합니다.
          </p>
        </header>

        <section className="mx-auto mt-9 w-full max-w-[627px] rounded-[37px] bg-[#0097ce] px-8 py-10 text-white sm:px-12 lg:min-h-[457px]">
          <h3 className="text-[34px] font-medium leading-tight sm:text-[42px]">
            {selectedPass.title}
          </h3>

          <div className="mt-8 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
            <p className="text-[27px] font-medium leading-[34px]">발급 조건 :</p>
            <div className="space-y-6">
              {conditions.map((condition) => (
                <label
                  key={condition.label}
                  className="grid grid-cols-[1fr_44px] items-center gap-4"
                  htmlFor={`condition-${condition.label}`}
                >
                  <input
                    id={`condition-${condition.label}`}
                    className="h-11 w-full rounded-[18px] border-0 bg-white px-5 text-[16px] font-medium text-[#313131] outline-none"
                    defaultValue={condition.label}
                    type="text"
                  />
                  <button
                    type="button"
                    aria-label={`${condition.label} ${condition.enabled ? '비활성화하기' : '활성화하기'}`}
                    aria-pressed={condition.enabled}
                    className="flex h-11 w-11 items-center justify-center rounded-full transition hover:scale-105 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-white/70"
                    onClick={(event) => {
                      event.preventDefault()
                      toggleCondition(condition.label)
                    }}
                  >
                    {condition.enabled ? <CheckIcon /> : <XIcon />}
                  </button>
                </label>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto mt-8 grid w-full max-w-[627px] gap-4 sm:grid-cols-2 sm:gap-[23px]">
          <a
            href="/managePass"
            className="flex h-12 items-center justify-center rounded-[15px] bg-[#0097ce] px-8 text-[17px] font-medium text-white transition hover:bg-[#0087b8] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#0097ce]/40"
          >
            이전
          </a>
          <button
            type="button"
            className="flex h-12 items-center justify-center rounded-[15px] bg-[#0097ce] px-8 text-[17px] font-medium text-white transition hover:bg-[#0087b8] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#0097ce]/40"
          >
            패스 수정 완료
          </button>
        </div>
      </section>
    </main>
  )
}

function CheckIcon() {
  return (
    <svg className="h-10 w-10" viewBox="0 0 30 30" aria-hidden="true">
      <circle cx="15" cy="15" r="15" fill="#35E014" />
      <path d="M8 15.5 13 20.5 22 10.5" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg className="h-10 w-10" viewBox="0 0 30 30" aria-hidden="true">
      <circle cx="15" cy="15" r="15" fill="#ff1f1f" />
      <path d="M10 10 20 20M20 10 10 20" stroke="#001d2b" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
