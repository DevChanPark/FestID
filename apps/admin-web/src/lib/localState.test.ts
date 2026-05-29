import { afterEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_FESTIVAL_INFO,
  DEFAULT_SUBMITTED_ADMIN_INFO,
  getFestivalInfo,
  getSubmittedAdminInfo,
  saveFestivalInfo,
  saveSubmittedAdminInfo
} from './localState'

describe('local page state', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('persists the submitted admin information for WaitVC', () => {
    saveSubmittedAdminInfo({
      schoolName: '광운대학교',
      organizationName: '총학생회',
      department: '축제기획국',
      position: '팀장',
      role: '운영팀장',
      proofFileName: 'proof.png',
      proofFilePreviewUrl: 'data:image/png;base64,proof'
    })

    expect(getSubmittedAdminInfo()).toMatchObject({
      schoolName: '광운대학교',
      organizationName: '총학생회',
      department: '축제기획국',
      position: '팀장',
      role: '운영팀장',
      proofFileName: 'proof.png',
      proofFilePreviewUrl: 'data:image/png;base64,proof'
    })
  })

  it('persists created festival information for dashboard settings', () => {
    saveFestivalInfo({
      ...DEFAULT_FESTIVAL_INFO,
      name: 'FestID 2026',
      host: 'FestID TF',
      startDate: '2026-05-29',
      endDate: '2026-05-30',
      place: '광운대학교 노천극장',
      description: '연결 테스트 축제입니다.',
      imageName: 'festival.png',
      imagePreviewUrl: 'data:image/png;base64,festival'
    })

    expect(getFestivalInfo()).toMatchObject({
      name: 'FestID 2026',
      host: 'FestID TF',
      startDate: '2026-05-29',
      endDate: '2026-05-30',
      place: '광운대학교 노천극장',
      description: '연결 테스트 축제입니다.',
      imageName: 'festival.png',
      imagePreviewUrl: 'data:image/png;base64,festival'
    })
  })

  it('returns defaults when no page state exists', () => {
    expect(getSubmittedAdminInfo()).toEqual(DEFAULT_SUBMITTED_ADMIN_INFO)
    expect(getFestivalInfo()).toEqual(DEFAULT_FESTIVAL_INFO)
  })
})
