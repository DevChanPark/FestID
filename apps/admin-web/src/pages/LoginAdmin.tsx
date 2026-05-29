import { useState } from 'react'
import { getMyAdminProfile } from '../lib/adminApi'
import { ApiError } from '../lib/api'
import { startMobileIdAuth, verifyMobileIdAuth } from '../lib/auth'
import type { MobileIdStartPayload, StartMobileIdAuthResponse } from '../types/api'

declare global {
  interface Window {
    OACX?: {
      LOAD_MODULE: (
        configUrl: string,
        request: Record<string, unknown>,
        callback: (result: unknown) => void
      ) => void
    }
  }
}

const DEFAULT_PROVIDER = 'omnione_cx'

export function LoginAdmin({
  onAuthenticated = (path: string) => window.location.assign(path)
}: {
  onAuthenticated?: (path: string) => void
}) {
  const [authResponse, setAuthResponse] = useState<StartMobileIdAuthResponse | null>(null)
  const [sdkResult, setSdkResult] = useState<unknown>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [message, setMessage] = useState('')

  const handleStart = async () => {
    setIsStarting(true)
    setMessage('')
    setSdkResult(null)

    try {
      const response = await startMobileIdAuth({
        provider: DEFAULT_PROVIDER,
        authFlow: 'app',
        requestType: 'WEB2APP',
        redirectUri: window.location.href
      })

      setAuthResponse(response)

      await launchOacxModule(response.payload, setSdkResult).catch((error) => {
        console.warn('OACX module launch failed.', error)
        setMessage('인증창 자동 호출에 실패했습니다. 모바일 인증 완료 후 확인 버튼으로 이어서 진행하세요.')
      })
    } catch (error) {
      setMessage(toErrorMessage(error, '모바일 신분증 인증 요청을 시작하지 못했습니다.'))
    } finally {
      setIsStarting(false)
    }
  }

  const handleVerify = async () => {
    if (!authResponse) {
      return
    }

    setIsVerifying(true)
    setMessage('')

    try {
      await verifyMobileIdAuth({
        provider: authResponse.provider,
        authRequestId: authResponse.authRequestId,
        state: authResponse.state,
        result: toResultRecord(sdkResult)
      })

      const profile = await getMyAdminProfile().catch((error) => {
        if (error instanceof ApiError && error.status === 404) {
          return null
        }

        throw error
      })

      if (!profile) {
        onAuthenticated('/submitInfo')
        return
      }

      onAuthenticated(profile.proofStatus === 'approved' ? '/createFest' : '/waitVC')
    } catch (error) {
      setMessage(toErrorMessage(error, '모바일 신분증 인증 결과를 확인하지 못했습니다.'))
    } finally {
      setIsVerifying(false)
    }
  }

  const closeDialog = () => {
    if (isStarting || isVerifying) {
      return
    }

    setAuthResponse(null)
    setSdkResult(null)
    setMessage('')
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
            className="mobile-id-button group h-[80px] w-full max-w-[320px] rounded-[40px] bg-[#001d2b] text-white transition duration-200 hover:bg-[#002b3f] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#0097ce] disabled:cursor-wait disabled:opacity-70"
            aria-label="모바일 신분증 로그인"
            disabled={isStarting}
            onClick={handleStart}
          >
            <MobileIdMark />
            <span className="text-[18px] font-bold tracking-normal">
              {isStarting ? '인증 요청 중' : '모바일 신분증 로그인'}
            </span>
          </button>
        </div>

        {message ? (
          <p className="mx-auto mt-6 max-w-[410px] break-keep text-center text-[14px] font-semibold leading-6 text-[#e24a4a] lg:absolute lg:left-[333px] lg:top-[580px] lg:mt-0">
            {message}
          </p>
        ) : null}

        <p className="mx-auto mt-8 text-center text-[16px] font-medium leading-normal tracking-normal sm:text-[19px] lg:absolute lg:left-[378px] lg:top-[640px] lg:mt-0 lg:w-[320px]">
          모바일 신분증이 없으신가요?{' '}
          <a className="whitespace-nowrap font-bold text-[#ff7777] hover:text-[#e85656]" href="/submitInfo">
            발급하기
          </a>
        </p>
      </section>

      {authResponse ? (
        <MobileIdDialog
          authResponse={authResponse}
          isVerifying={isVerifying}
          message={message}
          onClose={closeDialog}
          onVerify={handleVerify}
        />
      ) : null}
    </main>
  )
}

function MobileIdDialog({
  authResponse,
  isVerifying,
  message,
  onClose,
  onVerify
}: {
  authResponse: StartMobileIdAuthResponse
  isVerifying: boolean
  message: string
  onClose: () => void
  onVerify: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-5" role="presentation">
      <section
        aria-labelledby="mobile-id-auth-title"
        aria-modal="true"
        className="w-full max-w-[430px] overflow-hidden rounded-[18px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
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
            모바일 신분증 앱에서 인증 요청을 완료해주세요.
          </p>
          <dl className="mt-5 grid gap-2 rounded-[12px] bg-[#f8fafc] px-4 py-4 text-left text-[13px] text-[#5f6b76]">
            <div className="grid grid-cols-[96px_1fr] gap-3">
              <dt className="font-bold text-[#313131]">요청 ID</dt>
              <dd className="break-all">{authResponse.authRequestId}</dd>
            </div>
            {authResponse.payload?.cxId ? (
              <div className="grid grid-cols-[96px_1fr] gap-3">
                <dt className="font-bold text-[#313131]">CX ID</dt>
                <dd className="break-all">{String(authResponse.payload.cxId)}</dd>
              </div>
            ) : null}
            <div className="grid grid-cols-[96px_1fr] gap-3">
              <dt className="font-bold text-[#313131]">방식</dt>
              <dd>{authResponse.payload?.requestType || 'WEB2APP'}</dd>
            </div>
          </dl>
          {message ? (
            <p className="mt-4 break-keep text-[13px] font-semibold leading-5 text-[#e24a4a]">
              {message}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 border-t border-[#e6e9ee]">
          <button
            type="button"
            className="h-14 border-r border-[#e6e9ee] text-[16px] font-semibold text-[#4b5563] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isVerifying}
            onClick={onClose}
          >
            닫기
          </button>
          <button
            type="button"
            className="h-14 text-[16px] font-semibold text-[#0097ce] transition hover:bg-[#f4fbfe] disabled:cursor-wait disabled:opacity-60"
            disabled={isVerifying}
            onClick={onVerify}
          >
            {isVerifying ? '확인 중' : '인증 완료 확인'}
          </button>
        </div>
      </section>
    </div>
  )
}

async function launchOacxModule(
  payload: MobileIdStartPayload | undefined,
  onResult: (result: unknown) => void
) {
  if (!payload?.webBaseUrl || !payload.configUrl) {
    return
  }

  const webBaseUrl = payload.webBaseUrl.replace(/\/+$/, '')

  loadCss(`${webBaseUrl}/oacx-ux.css`)
  await loadScript(`${webBaseUrl}/oacx-vendor.js`)
  await loadScript(`${webBaseUrl}/oacx-ux.js`)

  window.OACX?.LOAD_MODULE(
    payload.configUrl,
    {
      contentInfo: {
        signType: payload.signType || 'ENT_MID'
      },
      compareCI: false
    },
    onResult
  )
}

function loadCss(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) {
    return
  }

  const link = document.createElement('link')
  link.href = href
  link.rel = 'stylesheet'
  document.head.appendChild(link)
}

function loadScript(src: string) {
  if (document.querySelector(`script[src="${src}"]`)) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(script)
  })
}

function toResultRecord(result: unknown) {
  if (typeof result === 'object' && result !== null && !Array.isArray(result)) {
    return result as Record<string, unknown>
  }

  return {}
}

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message || fallback
  }

  return fallback
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
