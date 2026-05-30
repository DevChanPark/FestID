import { useEffect, useRef, useState } from 'react'
import { getMyAdminProfile } from '../lib/adminApi'
import { ApiError } from '../lib/api'
import { startLocalAdminSession, startMobileIdAuth, verifyMobileIdAuth } from '../lib/auth'
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
const DEFAULT_MOBILE_ID_ISSUE_URL =
  'https://www.mobileid.go.kr/mip/hps/main.do'
const MOBILE_ID_ISSUE_URL =
  import.meta.env.VITE_MOBILE_ID_ISSUE_URL || DEFAULT_MOBILE_ID_ISSUE_URL
const SHOW_LOCAL_AUTH_BYPASS =
  import.meta.env.DEV || import.meta.env.VITE_SHOW_LOCAL_AUTH_BYPASS === 'true'

export function LoginAdmin({
  onAuthenticated = (path: string) => window.location.assign(path)
}: {
  onAuthenticated?: (path: string) => void
}) {
  const [authResponse, setAuthResponse] = useState<StartMobileIdAuthResponse | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isBypassing, setIsBypassing] = useState(false)
  const [message, setMessage] = useState('')
  const launchedAuthRequestIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!authResponse || launchedAuthRequestIdRef.current === authResponse.authRequestId) {
      return
    }

    let cancelled = false

    const launch = async () => {
      try {
        await waitForElement('oacxDiv')
        if (cancelled || launchedAuthRequestIdRef.current === authResponse.authRequestId) {
          return
        }

        launchedAuthRequestIdRef.current = authResponse.authRequestId
        await launchOacxModule(authResponse.payload, (result) => {
          if (!cancelled) {
            void completeMobileIdAuth(authResponse, result)
          }
        })
      } catch (error) {
        console.warn('OACX module launch failed.', error)
        if (!cancelled) {
          launchedAuthRequestIdRef.current = null
          setMessage('인증창 자동 호출에 실패했습니다. 모바일 인증 완료 후 확인 버튼으로 이어서 진행하세요.')
        }
      }
    }

    void launch()

    return () => {
      cancelled = true
    }
  }, [authResponse])

  const handleStart = async () => {
    setIsStarting(true)
    setMessage('')
    resetOacxMount()
    launchedAuthRequestIdRef.current = null

    try {
      const response = await startMobileIdAuth({
        provider: DEFAULT_PROVIDER,
        authFlow: 'app',
        requestType: 'WEB2APP',
        isBirth: true,
        redirectUri: window.location.href
      })

      setAuthResponse(response)
    } catch (error) {
      setMessage(toErrorMessage(error, '모바일 신분증 인증 요청을 시작하지 못했습니다.'))
    } finally {
      setIsStarting(false)
    }
  }

  const handleLocalBypass = async () => {
    setIsBypassing(true)
    setMessage('')
    setAuthResponse(null)
    resetOacxMount()
    launchedAuthRequestIdRef.current = null

    try {
      await startLocalAdminSession()
      onAuthenticated('/createFest')
    } catch (error) {
      setMessage(toErrorMessage(error, '로컬 개발용 관리자 세션을 생성하지 못했습니다.'))
    } finally {
      setIsBypassing(false)
    }
  }

  async function completeMobileIdAuth(response: StartMobileIdAuthResponse, result: unknown) {
    setIsVerifying(true)
    setMessage('')

    try {
      await verifyMobileIdAuth({
        provider: response.provider,
        authRequestId: response.authRequestId,
        state: response.state,
        result: toResultRecord(result)
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
      setAuthResponse(null)
      launchedAuthRequestIdRef.current = null
      resetOacxMount()
    }
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

        <div className="mx-auto mt-7 flex w-full max-w-[410px] flex-col items-center gap-3 lg:absolute lg:left-[333px] lg:top-[470px] lg:mt-0">
          <button
            type="button"
            className="mobile-id-button group h-[80px] w-full max-w-[320px] rounded-[40px] bg-[#001d2b] text-white transition duration-200 hover:bg-[#002b3f] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#0097ce] disabled:cursor-wait disabled:opacity-70"
            aria-label="모바일 신분증 로그인"
            disabled={isStarting || isVerifying || isBypassing}
            onClick={handleStart}
          >
            <MobileIdMark />
            <span className="text-[18px] font-bold tracking-normal">
              {isStarting ? '인증 요청 중' : isVerifying ? '인증 확인 중' : '모바일 신분증 로그인'}
            </span>
          </button>

          {SHOW_LOCAL_AUTH_BYPASS ? (
            <button
              type="button"
              className="h-11 w-full max-w-[320px] rounded-[22px] border border-[#0097ce] bg-white text-[14px] font-bold text-[#007eac] transition duration-200 hover:bg-[#eef9fd] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#0097ce] disabled:cursor-wait disabled:opacity-70"
              disabled={isStarting || isVerifying || isBypassing}
              onClick={handleLocalBypass}
            >
              {isBypassing ? '로컬 세션 생성 중' : '로컬 개발용으로 건너뛰기'}
            </button>
          ) : null}
        </div>

        {message ? (
          <p className="mx-auto mt-6 max-w-[410px] break-keep text-center text-[14px] font-semibold leading-6 text-[#e24a4a] lg:absolute lg:left-[333px] lg:top-[624px] lg:mt-0">
            {message}
          </p>
        ) : null}

        <p className="mx-auto mt-8 text-center text-[16px] font-medium leading-normal tracking-normal sm:text-[19px] lg:absolute lg:left-[378px] lg:top-[690px] lg:mt-0 lg:w-[320px]">
          모바일 신분증이 없으신가요?{' '}
          <a
            className="whitespace-nowrap font-bold text-[#ff7777] hover:text-[#e85656]"
            href={MOBILE_ID_ISSUE_URL}
            rel="noreferrer"
            target="_blank"
          >
            발급하기
          </a>
        </p>
      </section>

      {authResponse ? (
        <div className="fixed inset-0 z-50">
          <div id="oacxDiv" className="h-full w-full" />
        </div>
      ) : null}
    </main>
  )
}

function waitForElement(id: string) {
  if (document.getElementById(id)) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve, reject) => {
    let attempts = 0

    const check = () => {
      attempts += 1
      if (document.getElementById(id)) {
        resolve()
        return
      }

      if (attempts > 30) {
        reject(new Error(`Element #${id} was not mounted.`))
        return
      }

      window.requestAnimationFrame(check)
    }

    window.requestAnimationFrame(check)
  })
}

async function launchOacxModule(
  payload: MobileIdStartPayload | undefined,
  onResult: (result: unknown) => void
) {
  if (!payload?.webBaseUrl || !payload.configUrl) {
    return
  }

  const webBaseUrl = payload.webBaseUrl.replace(/\/+$/, '')

  if (!window.OACX?.LOAD_MODULE) {
    loadCss(`${webBaseUrl}/oacx-ux.css`)
    await loadScript(`${webBaseUrl}/oacx-vendor.js`)
    await loadScript(`${webBaseUrl}/oacx-ux.js`)
  }

  if (!document.getElementById('oacxDiv')) {
    throw new Error('OmniOne CX 인증창 영역을 찾지 못했습니다.')
  }

  if (!window.OACX?.LOAD_MODULE) {
    throw new Error('OmniOne CX 인증 모듈을 불러오지 못했습니다.')
  }

  window.OACX.LOAD_MODULE(
    payload.configUrl,
    {
      contentInfo: {
        signType: payload.signType || 'ENT_MID'
      },
      isBirth: payload.isBirth ?? true,
      compareCI: false
    },
    onResult
  )
}

function resetOacxMount() {
  const mount = document.getElementById('oacxDiv')
  if (mount) {
    mount.replaceChildren()
  }
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
  const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)

  if (existingScript?.dataset.loaded === 'true') {
    return Promise.resolve()
  }

  if (existingScript) {
    existingScript.remove()
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.async = false
    script.onload = () => {
      script.dataset.loaded = 'true'
      resolve()
    }
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(script)
  })
}

function toResultRecord(result: unknown) {
  if (typeof result === 'object' && result !== null && !Array.isArray(result)) {
    return result as Record<string, unknown>
  }

  if (typeof result === 'string' && result.trim()) {
    return { token: result.trim() }
  }

  return {}
}

function toErrorMessage(error: unknown, fallback: string) {
  const brTagPattern = new RegExp('<br\\s*/?>', 'gi')
  const normalizeMessage = (message: string) =>
    message.replace(brTagPattern, '\n').replace(/\n{3,}/g, '\n\n').trim()

  if (error instanceof ApiError || error instanceof Error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      return '백엔드 인증 API에 연결할 수 없습니다. backend 서버(localhost:3000)를 먼저 실행해 주세요.'
    }

    return normalizeMessage(error.message || fallback)
  }

  return normalizeMessage(fallback)
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
