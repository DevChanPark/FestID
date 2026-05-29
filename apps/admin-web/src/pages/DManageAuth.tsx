import { useEffect, useState, type ReactNode } from 'react'

import {
  AdminDashboardLayout,
  ChevronDownIcon,
  DashboardDaySelector,
  DashboardContent,
  type DashboardDay
} from '../components/AdminDashboardLayout'
import {
  approveStaffRequest,
  createStaffInvite,
  listStaffInvites,
  listStaffRequests,
  rejectStaffRequest
} from '../lib/adminApi'
import { resolveActiveFestival } from '../lib/activeFestival'
import type { StaffInvite, StaffRequest } from '../types/api'

const summaryStats: Record<DashboardDay, Array<{
  label: string
  value: string
  tone: 'blue' | 'green' | 'orange' | 'purple'
  icon: ReactNode
}>> = {
  'Day 1': [
    { label: '관리자', value: '2', tone: 'green', icon: <CrownIcon /> },
    { label: '스태프', value: '13', tone: 'orange', icon: <UserIcon /> },
    { label: '권한 승인 대기 중', value: '2', tone: 'purple', icon: <ClockIcon /> }
  ],
  'Day 2': [
    { label: '관리자', value: '3', tone: 'green', icon: <CrownIcon /> },
    { label: '스태프', value: '17', tone: 'orange', icon: <UserIcon /> },
    { label: '권한 승인 대기 중', value: '1', tone: 'purple', icon: <ClockIcon /> }
  ],
  'Day 3': [
    { label: '관리자', value: '3', tone: 'green', icon: <CrownIcon /> },
    { label: '스태프', value: '15', tone: 'orange', icon: <UserIcon /> },
    { label: '권한 승인 대기 중', value: '0', tone: 'purple', icon: <ClockIcon /> }
  ]
}

const fallbackManagers = [
  { name: '관리자1', group: '축제 운영본부', did: 'did:example:abcd1234', role: '공동 관리자', status: '활성' },
  { name: '관리자2', group: '축제 운영본부', did: 'did:example:abcd5678', role: '공동 관리자', status: '활성' },
  { name: '박스태프', group: 'A구역 주점', did: 'did:example:efgh5678', role: '스태프', status: '활성' },
  { name: '김스태프', group: '현장 운영팀', did: 'did:example:ijkl9012', role: '스태프', status: '대기중' }
]

const fallbackStaffRequests = [
  { id: 'fallback-admin', name: '김관리', group: '축제 운영본부', did: 'did:example:req1234', phone: '010-1234-5678', role: '공동 관리자' },
  { id: 'fallback-staff-1', name: '박스태프', group: 'A구역 주점', did: 'did:example:req5678', phone: '010-9876-5432', role: '스태프' },
  { id: 'fallback-staff-2', name: '이운영', group: '현장 운영팀', did: 'did:example:req9012', phone: '010-5555-1212', role: '스태프' }
]

type RoleFilter = '공동 관리자' | '스태프'

function maskDid(did: string) {
  const lastSeparatorIndex = did.lastIndexOf(':')
  if (lastSeparatorIndex < 0) {
    return did.length <= 6 ? did : `${did.slice(0, 2)}****${did.slice(-2)}`
  }

  const prefix = did.slice(0, lastSeparatorIndex)
  const suffix = did.slice(lastSeparatorIndex + 1)

  if (suffix.length <= 4) {
    return `${prefix}:****`
  }

  return `${prefix}:${suffix.slice(0, 2)}****${suffix.slice(-2)}`
}

const roleTone = {
  '공동 관리자': 'bg-[#eaf2ff] text-[#2f80ff]',
  스태프: 'bg-[#fff1e8] text-[#ff7a1a]'
}

const statusTone = {
  활성: 'bg-[#e8f8ee] text-[#28a75a]',
  대기중: 'bg-[#f2eafe] text-[#8b5cf6]'
}

export function DManageAuth() {
  const [selectedDay, setSelectedDay] = useState<DashboardDay>('Day 1')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('공동 관리자')
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false)
  const [openManagerMenu, setOpenManagerMenu] = useState<string | null>(null)
  const [openRequestMenu, setOpenRequestMenu] = useState<string | null>(null)
  const [activeFestivalId, setActiveFestivalId] = useState('')
  const [staffInvites, setStaffInvites] = useState<StaffInvite[]>([])
  const [staffRequestItems, setStaffRequestItems] = useState<StaffRequest[]>([])
  const [statusMessage, setStatusMessage] = useState('')
  const [isCreatingInvite, setIsCreatingInvite] = useState(false)
  const [inviteRole, setInviteRole] = useState('gate_staff')

  const managerRows = buildManagerRows(staffRequestItems, staffInvites)
  const requestRows = buildRequestRows(staffRequestItems)
  const filteredManagers = (managerRows.length > 0 ? managerRows : fallbackManagers).filter(
    (manager) => manager.role === roleFilter
  )
  const visibleStaffRequests = requestRows.length > 0 ? requestRows : fallbackStaffRequests
  const pendingRequestCount = staffRequestItems.filter((request) => request.status === 'requested').length
  const dynamicSummaryStats = staffRequestItems.length > 0 || staffInvites.length > 0
    ? [
        { label: '관리자', value: '1', tone: 'green' as const, icon: <CrownIcon /> },
        { label: '스태프', value: String(managerRows.filter((manager) => manager.role === '스태프').length), tone: 'orange' as const, icon: <UserIcon /> },
        { label: '권한 승인 대기 중', value: String(pendingRequestCount), tone: 'purple' as const, icon: <ClockIcon /> }
      ]
    : summaryStats[selectedDay]

  const refreshStaff = async (festivalId: string) => {
    const [invites, requests] = await Promise.all([
      listStaffInvites(festivalId),
      listStaffRequests(festivalId)
    ])
    setStaffInvites(invites)
    setStaffRequestItems(requests)
    setStatusMessage(`초대 ${invites.length}개, 권한 요청 ${requests.length}개를 불러왔습니다.`)
  }

  useEffect(() => {
    let ignore = false

    resolveActiveFestival()
      .then(async ({ festivalId }) => {
        if (!ignore) {
          setActiveFestivalId(festivalId)
        }
        const [invites, requests] = await Promise.all([
          listStaffInvites(festivalId),
          listStaffRequests(festivalId)
        ])
        if (!ignore) {
          setStaffInvites(invites)
          setStaffRequestItems(requests)
          setStatusMessage(`초대 ${invites.length}개, 권한 요청 ${requests.length}개를 불러왔습니다.`)
        }
      })
      .catch((error) => {
        if (!ignore) {
          setStatusMessage(error instanceof Error ? error.message : '권한 데이터를 불러오지 못했습니다.')
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  const handleCreateInvite = async () => {
    if (!activeFestivalId) {
      setStatusMessage('축제 정보를 먼저 생성하거나 불러와 주세요.')
      return
    }

    setIsCreatingInvite(true)

    try {
      await createStaffInvite(activeFestivalId, {
        role: inviteRole,
        scope: ['entry_scan', 'benefit_check']
      })
      await refreshStaff(activeFestivalId)
      setStatusMessage('스태프 초대 코드가 생성되었습니다.')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : '스태프 초대 코드 생성에 실패했습니다.')
    } finally {
      setIsCreatingInvite(false)
    }
  }

  const handleRequestAction = async (requestId: string, action: 'approve' | 'reject') => {
    if (!activeFestivalId) {
      return
    }

    try {
      if (action === 'approve') {
        await approveStaffRequest(requestId)
      } else {
        await rejectStaffRequest(requestId)
      }
      await refreshStaff(activeFestivalId)
      setStatusMessage(action === 'approve' ? '스태프 권한을 승인했습니다.' : '스태프 권한 요청을 거절했습니다.')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : '스태프 요청 처리에 실패했습니다.')
    }
  }

  return (
    <AdminDashboardLayout activeSection="auth">
      <DashboardContent>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-[31px] font-bold leading-tight">권한 관리</h2>
          <DashboardDaySelector value={selectedDay} onChange={setSelectedDay} />
        </div>

        <section className="rounded-[10px] bg-white px-5 py-4 shadow-[7px_9px_30px_rgba(0,0,0,0.08)]">
          <h3 className="text-[19px] font-semibold">요약</h3>
          {statusMessage ? (
            <p className="mt-2 break-keep text-[14px] font-semibold text-[#5b6775]">{statusMessage}</p>
          ) : null}
          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            {dynamicSummaryStats.map((stat) => (
              <SummaryCard key={stat.label} {...stat} />
            ))}
          </div>
        </section>

        <section className="mt-3 rounded-[10px] bg-white px-5 py-5 shadow-[7px_9px_30px_rgba(0,0,0,0.08)]">
          <div className="flex flex-wrap items-start gap-3">
            <div className="relative w-full max-w-[238px]">
              <SearchSmallIcon />
              <input
                className="h-[39px] w-full rounded-[8px] border border-[#e1e1e1] bg-white pl-10 pr-3 text-[15px] outline-none placeholder:text-[#9ca3af] focus:border-[#2f80ff]"
                placeholder="검색창"
                type="search"
              />
            </div>
            <div className="relative">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isRoleDropdownOpen}
                onClick={() => setIsRoleDropdownOpen((open) => !open)}
                className="flex h-[39px] w-[150px] items-center justify-between rounded-[8px] border border-[#e1e1e1] bg-white px-4 text-[15px] font-semibold"
              >
                {roleFilter}
                <ChevronDownIcon />
              </button>
              {isRoleDropdownOpen ? (
                <div
                  role="listbox"
                  aria-label="역할 필터 선택"
                  className="absolute left-0 top-10 z-30 w-[139px] overflow-hidden rounded-[8px] border border-[#e1e1e1] bg-white py-1 shadow-[0_10px_24px_rgba(0,0,0,0.12)]"
                >
                  {(['공동 관리자', '스태프'] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      role="option"
                      aria-selected={roleFilter === role}
                      onClick={() => {
                        setRoleFilter(role)
                        setIsRoleDropdownOpen(false)
                        setOpenManagerMenu(null)
                      }}
                      className={`block w-full px-4 py-2.5 text-left text-[15px] font-semibold ${
                        roleFilter === role ? 'bg-[#e8f1ff] text-[#2f80ff]' : 'text-[#313131] hover:bg-[#f5f8ff]'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <span className="basis-full text-[15px] font-semibold text-[#313131]">
              인원 : {filteredManagers.length}명
            </span>
          </div>

          <div className="mt-3 overflow-visible rounded-[8px] border border-[#e1e1e1]">
            <table className="w-full table-fixed text-left text-[14px]">
              <thead className="bg-[#fafafa] text-[#313131]">
                <tr>
                  <th className="w-[68px] whitespace-nowrap px-4 py-3 font-semibold">선택</th>
                  <th className="px-4 py-3 font-semibold">이름</th>
                  <th className="px-4 py-3 font-semibold">소속</th>
                  <th className="px-4 py-3 font-semibold">DID</th>
                  <th className="px-4 py-3 font-semibold">역할</th>
                  <th className="px-4 py-3 font-semibold">상태</th>
                  <th className="px-4 py-3 font-semibold">상세 관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececec]">
                {filteredManagers.map((manager) => (
                  <tr key={manager.did}>
                    <td className="px-4 py-3">
                      <input className="h-4 w-4 rounded border-[#d1d5db]" type="checkbox" aria-label={`${manager.name} 선택`} />
                    </td>
                    <td className="px-4 py-3 font-medium">{manager.name}</td>
                    <td className="px-4 py-3">{manager.group}</td>
                    <td className="truncate px-4 py-3">{maskDid(manager.did)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-[13px] font-semibold ${roleTone[manager.role as keyof typeof roleTone]}`}>
                        {manager.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-[13px] font-semibold ${statusTone[manager.status as keyof typeof statusTone]}`}>
                        {manager.status}
                      </span>
                    </td>
                    <td className="relative px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setOpenManagerMenu((open) => (open === manager.did ? null : manager.did))}
                        className="font-semibold text-[#2f80ff]"
                      >
                        상세 관리
                      </button>
                      {openManagerMenu === manager.did ? (
                        <ActionMenu
                          items={['역할 수정', '권한 삭제', '권한 승인']}
                          className="right-2 top-8"
                        />
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-3 rounded-[10px] bg-white px-5 py-5 shadow-[7px_9px_30px_rgba(0,0,0,0.08)]">
          <h3 className="text-[19px] font-semibold">스태프 권한 요청 목록</h3>
          <span className="mt-2 block text-[15px] font-semibold text-[#313131]">인원 : {visibleStaffRequests.length}명</span>
          <div className="mt-3 overflow-visible rounded-[8px] border border-[#e1e1e1]">
            <table className="w-full table-fixed text-left text-[14px]">
              <thead className="bg-[#fafafa] text-[#313131]">
                <tr>
                  {['이름', '소속', 'DID', '연락처', '상세 관리'].map((heading) => (
                    <th key={heading} className="px-4 py-3 font-semibold">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececec]">
                {visibleStaffRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-4 py-3 font-medium">{request.name}</td>
                    <td className="px-4 py-3">{request.group}</td>
                    <td className="truncate px-4 py-3">{maskDid(request.did)}</td>
                    <td className="px-4 py-3">{request.phone}</td>
                    <td className="relative px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setOpenRequestMenu((open) => (open === request.did ? null : request.did))}
                        className="font-semibold text-[#2f80ff]"
                      >
                        상세 관리
                      </button>
                      {openRequestMenu === request.did ? (
                        <ActionMenu
                          items={['승인', '거절']}
                          className="right-2 top-8"
                          onSelect={(item) => {
                            if ('id' in request && request.id) {
                              void handleRequestAction(request.id, item === '승인' ? 'approve' : 'reject')
                            }
                          }}
                        />
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-3 rounded-[10px] bg-white px-5 py-5 shadow-[7px_9px_30px_rgba(0,0,0,0.08)]">
          <h3 className="text-[19px] font-semibold">권한 위임하기</h3>
          <form className="mt-3 grid gap-x-10 gap-y-3 lg:grid-cols-2">
            <Field label="이름" placeholder="이름을 입력하세요" />
            <Field label="학번" placeholder="학번을 입력하세요" />
            <Field label="DID" placeholder="DID를 입력하세요" />
            <label className="grid grid-cols-[86px_1fr] items-center gap-3 text-[16px] font-semibold">
              <span>역할</span>
              <input
                className="h-[40px] rounded-[8px] border border-[#e1e1e1] px-4 text-[15px] font-medium outline-none placeholder:text-[#9ca3af] focus:border-[#2f80ff]"
                placeholder="gate_staff"
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value)}
              />
            </label>
            <button
              type="button"
              disabled={isCreatingInvite}
              onClick={handleCreateInvite}
              className="mt-2 flex h-[42px] items-center justify-center rounded-[8px] bg-[#0d6efd] text-[16px] font-semibold text-white shadow-[0_6px_16px_rgba(13,110,253,0.22)] transition hover:bg-[#0b5ed7] lg:col-start-2 lg:ml-auto lg:w-[190px]"
            >
              {isCreatingInvite ? '생성 중' : '위임하기'}
            </button>
          </form>
        </section>
      </DashboardContent>
    </AdminDashboardLayout>
  )
}

function SummaryCard({
  label,
  value,
  tone,
  icon
}: {
  label: string
  value: string
  tone: 'blue' | 'green' | 'orange' | 'purple'
  icon: ReactNode
}) {
  const toneClass = {
    blue: 'bg-[#eaf2ff] text-[#2f80ff]',
    green: 'bg-[#e8f8ee] text-[#28a75a]',
    orange: 'bg-[#fff1e8] text-[#ff7a1a]',
    purple: 'bg-[#f2eafe] text-[#8b5cf6]'
  }[tone]

  return (
    <article className="flex min-h-[88px] items-center gap-5 rounded-[8px] border border-[#e1e1e1] bg-white px-5">
      <span className={`flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full ${toneClass}`}>
        {icon}
      </span>
      <div>
        <p className="text-[15px] font-medium text-[#4b5563]">{label}</p>
        <p className="text-[31px] font-semibold leading-none">{value}</p>
      </div>
    </article>
  )
}

function buildManagerRows(requests: StaffRequest[], invites: StaffInvite[]) {
  const approvedStaff = requests
    .filter((request) => request.status === 'approved')
    .map((request) => ({
      name: request.userId || '스태프',
      group: request.requestedRole || '현장 운영팀',
      did: request.maskedDid || request.userId || request.id,
      role: '스태프',
      status: '활성'
    }))

  if (approvedStaff.length > 0) {
    return approvedStaff
  }

  return invites.map((invite) => ({
    name: invite.inviteCode,
    group: invite.role,
    did: invite.id,
    role: '스태프',
    status: invite.status === 'revoked' ? '대기중' : '활성'
  }))
}

function buildRequestRows(requests: StaffRequest[]) {
  return requests
    .filter((request) => request.status === 'requested')
    .map((request) => ({
      id: request.id,
      name: request.userId || '스태프 요청',
      group: request.requestedRole || '현장 운영팀',
      did: request.maskedDid || request.userId || request.id,
      phone: '-',
      role: request.requestedRole || '스태프'
    }))
}

function ActionMenu({
  items,
  className,
  onSelect
}: {
  items: string[]
  className?: string
  onSelect?: (item: string) => void
}) {
  return (
    <div
      className={`absolute z-30 w-[128px] overflow-hidden rounded-[8px] border border-[#e1e1e1] bg-white py-1 shadow-[0_10px_24px_rgba(0,0,0,0.12)] ${className ?? ''}`}
    >
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onSelect?.(item)}
          className={`block w-full px-3 py-2.5 text-left text-[14px] font-semibold transition hover:bg-[#f5f8ff] ${
            item.includes('삭제') || item === '거절' ? 'text-[#ff352e]' : 'text-[#2f80ff]'
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  )
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="grid grid-cols-[86px_1fr] items-center gap-3 text-[16px] font-semibold">
      <span>{label}</span>
      <input
        className="h-[40px] rounded-[8px] border border-[#e1e1e1] px-4 text-[15px] font-medium outline-none placeholder:text-[#9ca3af] focus:border-[#2f80ff]"
        placeholder={placeholder}
      />
    </label>
  )
}

function SearchSmallIcon() {
  return (
    <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="9" cy="9" r="5" />
      <path d="m13 13 3 3" />
    </svg>
  )
}

function CrownIcon() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m4 9 4 3 4-7 4 7 4-3-2 10H6z" />
      <path d="M7 19h10" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20c1.1-3.7 3.4-5.5 7-5.5s5.9 1.8 7 5.5" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v5l3 2" />
    </svg>
  )
}
