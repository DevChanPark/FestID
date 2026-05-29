import { useState } from 'react'
import { setAccessToken } from '../lib/auth'

const DEV_MOBILE_ID_ACCESS_TOKEN = 'dev-mobile-id-cancel-login'

export function LoginAdmin({
  onAuthenticated = (path: string) => window.location.assign(path)
}: {
  onAuthenticated?: (path: string) => void
}) {
  const [isAuthWindowOpen, setIsAuthWindowOpen] = useState(false)

  const completeDevLogin = () => {
    setAccessToken(DEV_MOBILE_ID_ACCESS_TOKEN)
    onAuthenticated('/submitInfo')
  }

  return (
    <main className="grid min-h-screen place-items-center bg-white px-5 py-10 font-sans text-[#313131]">
      <section
        aria-labelledby="login-admin-title"
        className="relative flex min-h-[640px] w-full max-w-[1076px] flex-col rounded-[30px] bg-white px-8 py-10 shadow-login sm:px-14 lg:h-[765px] lg:rounded-[38px]"
      >
        <h1 className="font-brand mx-auto text-[48px] leading-none text-[#0097ce] sm:text-[61px]">
          CamPass
        </h1>

        <div className="mx-auto mt-12 w-full max-w-[410px] lg:absolute lg:left-[333px] lg:top-[177px] lg:mt-0">
          <p
            id="login-admin-title"
            className="break-keep text-[26px] font-bold leading-[1.67] tracking-normal text-[#1a1a1a] sm:text-[31px]"
          >
            입장부터 혜택까지,
            <br />
            캠퍼스를 통과하는 가장 쉬운 방법
          </p>
        </div>

        <div className="mx-auto mt-16 w-full max-w-[410px] lg:absolute lg:left-[333px] lg:top-[366px] lg:mt-0">
          <h2 className="text-[38px] font-semibold leading-none tracking-normal text-[#313131]">
            Login
          </h2>
          <p className="mt-[15px] break-keep text-[15px] leading-relaxed text-[#313131]">
            모바일 신분증을 활용하여 관리자 전용 대시보드에 로그인하세요.
          </p>
        </div>

        <div className="mx-auto mt-7 flex w-full max-w-[410px] justify-center lg:absolute lg:left-[333px] lg:top-[484px] lg:mt-0">
          <button
            type="button"
            className="mobile-id-button group h-[80px] w-full max-w-[320px] rounded-[40px] bg-[#001d2b] text-white transition duration-200 hover:bg-[#002b3f] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#0097ce]"
            aria-label="모바일 신분증 로그인"
            onClick={() => setIsAuthWindowOpen(true)}
          >
            <MobileIdMark />
            <span className="text-[18px] font-bold tracking-normal">모바일 신분증 로그인</span>
          </button>
        </div>

        <p className="mx-auto mt-8 text-center text-[16px] font-medium leading-normal tracking-normal sm:text-[19px] lg:absolute lg:left-[378px] lg:top-[640px] lg:mt-0 lg:w-[320px]">
          모바일 신분증이 없으신가요?{' '}
          <a className="whitespace-nowrap font-bold text-[#ff7777] hover:text-[#e85656]" href="/submitInfo">
            발급하기
          </a>
        </p>
      </section>

      {isAuthWindowOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-5"
          role="presentation"
        >
          <section
            aria-labelledby="mobile-id-auth-title"
            aria-modal="true"
            className="w-full max-w-[390px] overflow-hidden rounded-[18px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
            role="dialog"
          >
            <div className="bg-[#001d2b] px-6 py-5 text-white">
              <p className="text-[13px] font-semibold text-white/70">OmniOne CX</p>
              <h2 id="mobile-id-auth-title" className="mt-1 text-[22px] font-bold">
                모바일 신분증 표준인증
              </h2>
            </div>

            <div className="px-6 py-7 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[22px] bg-[#f0f8ff]">
                <MobileIdMark />
              </div>
              <p className="mt-5 break-keep text-[17px] font-bold text-[#1a1a1a]">
                모바일 신분증 앱에서 인증 요청을 확인해주세요.
              </p>
              <p className="mt-2 break-keep text-[14px] leading-6 text-[#5f6b76]">
                현재 개발 환경에서는 취소해도 관리자 정보 입력으로 이동합니다.
              </p>
            </div>

            <div className="grid grid-cols-2 border-t border-[#e6e9ee]">
              <button
                type="button"
                className="h-14 border-r border-[#e6e9ee] text-[16px] font-semibold text-[#4b5563] transition hover:bg-[#f8fafc]"
                onClick={completeDevLogin}
              >
                취소
              </button>
              <button
                type="button"
                className="h-14 text-[16px] font-semibold text-[#0097ce] transition hover:bg-[#f4fbfe]"
                onClick={completeDevLogin}
              >
                확인
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}

function MobileIdMark() {
  return (
    <span className="relative h-10 w-12 shrink-0" aria-hidden="true">
      <span className="absolute left-[2px] top-[13px] h-[11px] w-[35px] -skew-x-[28deg] bg-[#2e7dd7]" />
      <span className="absolute left-[13px] top-[4px] h-[12px] w-[37px] -skew-x-[28deg] bg-[#f0444f]" />
      <span className="absolute left-[12px] top-[24px] h-[10px] w-[26px] -skew-x-[28deg] bg-[#1d5db8]" />
      <span className="absolute left-[19px] top-[15px] h-[11px] w-[26px] -skew-x-[28deg] bg-white" />
    </span>
  )
}
