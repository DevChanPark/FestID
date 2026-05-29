import { listMyFestivals } from './adminApi'
import { DEFAULT_FESTIVAL_INFO, getFestivalInfo, saveFestivalInfo } from './localState'
import type { Festival } from '../types/api'

export type ActiveFestival = {
  festivalId: string
  festival?: Festival
}

export async function resolveActiveFestival(): Promise<ActiveFestival> {
  const storedFestival = getFestivalInfo()

  if (storedFestival.backendId) {
    return { festivalId: storedFestival.backendId }
  }

  const festivals = await listMyFestivals()
  const firstFestival = festivals[0]

  if (!firstFestival?.id) {
    throw new Error('관리할 축제가 없습니다. 먼저 축제를 생성해 주세요.')
  }

  saveFestivalInfo({
    name: firstFestival.name || DEFAULT_FESTIVAL_INFO.name,
    host: firstFestival.schoolName || DEFAULT_FESTIVAL_INFO.host,
    startDate: firstFestival.startDate || DEFAULT_FESTIVAL_INFO.startDate,
    endDate: firstFestival.endDate || DEFAULT_FESTIVAL_INFO.endDate,
    place: firstFestival.location || DEFAULT_FESTIVAL_INFO.place,
    description: firstFestival.description || DEFAULT_FESTIVAL_INFO.description,
    imageName: '',
    imagePreviewUrl: firstFestival.imageUrl || '',
    backendId: firstFestival.id
  })

  return { festivalId: firstFestival.id, festival: firstFestival }
}
