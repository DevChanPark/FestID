export function LoginAdmin() {
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
          <a
            href="/submitInfo"
            className="mobile-id-button group h-[80px] w-full max-w-[320px] rounded-[40px] bg-[#001d2b] text-white transition duration-200 hover:bg-[#002b3f] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#0097ce]"
            aria-label="모바일 신분증 로그인"
          >
            <MobileIdMark />
            <span className="text-[18px] font-bold tracking-normal">모바일 신분증 로그인</span>
          </a>
        </div>

        <p className="mx-auto mt-8 text-center text-[16px] font-medium leading-normal tracking-normal sm:text-[19px] lg:absolute lg:left-[378px] lg:top-[640px] lg:mt-0 lg:w-[320px]">
          모바일 신분증이 없으신가요?{' '}
          <a className="whitespace-nowrap font-bold text-[#ff7777] hover:text-[#e85656]" href="/submitInfo">
            발급하기
          </a>
        </p>
      </section>
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
