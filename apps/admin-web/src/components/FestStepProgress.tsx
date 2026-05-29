export function FestStepProgress({ activeStep }: { activeStep: 1 | 2 }) {
  return (
    <div className="mt-4 flex min-h-[62px] items-center justify-center rounded-[15px] border border-[#e0e0e0] px-4 py-4 sm:min-h-[87px]">
      <ol className="relative grid w-full max-w-[460px] grid-cols-[1fr_1fr] items-start text-center text-[13px] text-[#313131] sm:text-[15px]">
        <span
          className="absolute left-[25%] right-[25%] top-4 h-[2px] bg-[#1a1a1a]"
          aria-hidden="true"
        />
        <Step number={1} label="기본 정보 입력" active={activeStep === 1} />
        <Step number={2} label="패스 템플릿 설정" active={activeStep === 2} />
      </ol>
    </div>
  )
}

function Step({ number, label, active }: { number: number; label: string; active: boolean }) {
  return (
    <li className="relative z-10 flex flex-col items-center gap-2">
      <span
        className={[
          'flex h-8 w-8 items-center justify-center rounded-full border-2 text-[17px] leading-none',
          active
            ? 'border-[#0097ce] bg-[#0097ce] text-white'
            : 'border-[#1a1a1a] bg-white text-[#1a1a1a]'
        ].join(' ')}
      >
        {number}
      </span>
      <span className="break-keep">{label}</span>
    </li>
  )
}
