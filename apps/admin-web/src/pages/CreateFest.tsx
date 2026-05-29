import { useState, type ChangeEvent, type FormEvent } from 'react'
import { FestStepProgress } from '../components/FestStepProgress'
import { createFestival, uploadFile } from '../lib/adminApi'
import { ApiError } from '../lib/api'
import { getAccessToken } from '../lib/auth'
import { isPreviewableImage, readFileAsDataUrl } from '../lib/filePreview'
import { DEFAULT_FESTIVAL_INFO, saveFestivalInfo } from '../lib/localState'

const festivalFields = [
  { id: 'festival-name', name: 'name', label: '축제명', placeholder: '축제명을 입력하세요 ...' },
  { id: 'festival-host', name: 'host', label: '학교명', placeholder: '학교명을 입력하세요 ...' },
  { id: 'festival-place', name: 'place', label: '운영 장소', placeholder: '운영 장소를 입력하세요 ...' }
]

const allowedImageTypes = ['application/pdf', 'image/jpeg', 'image/png']

export function CreateFest({
  onCreated = (path: string) => window.location.assign(path)
}: {
  onCreated?: (path: string) => void
}) {
  const [imageName, setImageName] = useState('')
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      setSelectedImage(null)
      setImageName('')
      setImagePreviewUrl('')
      return
    }

    if (!allowedImageTypes.includes(file.type)) {
      window.alert('PDF, JPG, PNG 파일만 업로드할 수 있습니다.')
      event.target.value = ''
      setSelectedImage(null)
      setImageName('')
      setImagePreviewUrl('')
      return
    }

    setSelectedImage(file)
    setImageName(file.name)
    setImagePreviewUrl(isPreviewableImage(file) ? await readFileAsDataUrl(file) : '')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')

    if (!getAccessToken()) {
      setErrorMessage('관리자 로그인이 필요합니다.')
      return
    }

    const formData = new FormData(event.currentTarget)

    const festivalInfo = saveFestivalInfo({
      ...DEFAULT_FESTIVAL_INFO,
      name: String(formData.get('name') || DEFAULT_FESTIVAL_INFO.name),
      host: String(formData.get('host') || DEFAULT_FESTIVAL_INFO.host),
      startDate: String(formData.get('startDate') || DEFAULT_FESTIVAL_INFO.startDate),
      endDate: String(formData.get('endDate') || DEFAULT_FESTIVAL_INFO.endDate),
      place: String(formData.get('place') || DEFAULT_FESTIVAL_INFO.place),
      description: String(formData.get('description') || DEFAULT_FESTIVAL_INFO.description),
      imageName,
      imagePreviewUrl
    })

    setIsSubmitting(true)

    try {
      const uploadedImage = selectedImage ? await uploadFile('festival-image', selectedImage) : null
      const createdFestival = await createFestival({
        name: festivalInfo.name,
        schoolName: festivalInfo.host,
        startDate: festivalInfo.startDate,
        endDate: festivalInfo.endDate,
        location: festivalInfo.place,
        description: festivalInfo.description,
        imageUrl: uploadedImage?.fileUrl,
        visibility: 'public',
        status: 'active'
      })

      saveFestivalInfo({
        ...festivalInfo,
        backendId: createdFestival.id
      })

      onCreated('/managePass')
    } catch (error) {
      setErrorMessage(toErrorMessage(error, '축제 생성에 실패했습니다.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-white px-5 py-8 font-sans text-[#1a1a1a] sm:py-10">
      <h1 className="font-brand mx-auto text-center text-[42px] leading-none text-[#0097ce] sm:text-[49px]">
        CamPass
      </h1>

      <section
        aria-labelledby="create-fest-title"
        className="mx-auto mt-9 w-full max-w-[1076px] rounded-[30px] bg-white px-8 py-10 shadow-panel sm:px-14 lg:min-h-[765px] lg:rounded-[38px]"
      >
        <header>
          <h2
            id="create-fest-title"
            className="break-keep text-[25px] font-bold leading-[1.45] tracking-normal sm:text-[31px]"
          >
            새 축제 생성
          </h2>
          <p className="mt-1 break-keep text-[15px] leading-relaxed text-[#313131]">
            관리할 축제를 생성합니다.
          </p>
        </header>

        <FestStepProgress activeStep={1} />

        <section className="mt-7">
          <h3 className="break-keep text-[25px] font-bold leading-[1.45] tracking-normal sm:text-[31px]">
            1. 기본 정보 입력
          </h3>
          <p className="mt-1 break-keep text-[15px] leading-relaxed text-[#313131]">
            축제에 필요한 기본적인 정보를 입력해주세요.
          </p>

          <form
            id="create-fest-form"
            className="mt-2 rounded-[15px] border border-[#e0e0e0] px-6 py-7 sm:px-8"
            onSubmit={handleSubmit}
          >
            <div className="grid gap-x-14 gap-y-5 lg:grid-cols-2">
              {festivalFields.map((field) => (
                <div key={field.id}>
                  <label htmlFor={field.id} className="block text-[15px] font-bold leading-5">
                    {field.label}
                  </label>
                  <input
                    id={field.id}
                    name={field.name}
                    className="mt-[5px] h-[33px] w-full rounded-[15px] border border-[#e0e0e0] bg-white px-[22px] text-[12px] outline-none transition placeholder:text-[#8a8a8a] focus:border-[#0097ce] focus:ring-4 focus:ring-[#0097ce]/15"
                    placeholder={field.placeholder}
                    type="text"
                  />
                </div>
              ))}

              <div>
                <label htmlFor="festival-start-date" className="block text-[15px] font-bold leading-5">
                  운영 기간
                </label>
                <div className="mt-[5px] grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <input
                    id="festival-start-date"
                    name="startDate"
                    aria-label="운영 시작일"
                    className="h-[33px] w-full rounded-[15px] border border-[#e0e0e0] bg-white px-[16px] text-[12px] outline-none transition focus:border-[#0097ce] focus:ring-4 focus:ring-[#0097ce]/15"
                    type="date"
                  />
                  <span className="text-[13px] font-bold text-[#454545]">~</span>
                  <input
                    id="festival-end-date"
                    name="endDate"
                    aria-label="운영 종료일"
                    className="h-[33px] w-full rounded-[15px] border border-[#e0e0e0] bg-white px-[16px] text-[12px] outline-none transition focus:border-[#0097ce] focus:ring-4 focus:ring-[#0097ce]/15"
                    type="date"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="festival-description" className="block text-[15px] font-bold leading-5">
                  축제 설명
                </label>
                <textarea
                  id="festival-description"
                  name="description"
                  className="mt-[5px] h-20 w-full resize-none overflow-hidden rounded-[15px] border border-[#e0e0e0] bg-white px-[22px] py-3 text-[12px] leading-5 outline-none transition placeholder:text-[#8a8a8a] focus:border-[#0097ce] focus:ring-4 focus:ring-[#0097ce]/15"
                  placeholder="축제 설명을 입력하세요 ..."
                />
              </div>

              <div>
                <label className="block text-[15px] font-bold leading-5" htmlFor="festival-image">
                  축제 이미지
                </label>
                <label
                  className="mt-[5px] flex h-20 cursor-pointer items-center gap-3 rounded-[15px] border border-dashed border-[#0097ce]/70 bg-[#f4fbfe] px-[22px] text-[12px] text-[#313131] transition hover:border-[#0097ce] hover:bg-[#eaf8fd]"
                  htmlFor="festival-image"
                >
                  <input
                    className="sr-only"
                    id="festival-image"
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
                    onChange={handleImageChange}
                  />
                  {imagePreviewUrl ? (
                    <img
                      src={imagePreviewUrl}
                      alt="축제 이미지 미리보기"
                      className="h-16 w-24 shrink-0 rounded-[10px] object-cover shadow-[0_6px_18px_rgba(0,0,0,0.12)]"
                    />
                  ) : (
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0097ce] text-xl font-semibold text-white"
                      aria-hidden="true"
                    >
                      +
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block font-semibold text-[#1a1a1a]">
                      {imageName || '축제 이미지를 추가해주세요 ...'}
                    </span>
                    <span className="mt-1 block text-[#6f6f6f]">PDF, JPG, PNG 파일 업로드</span>
                  </span>
                </label>
              </div>
            </div>
          </form>
        </section>

        <button
          type="submit"
          form="create-fest-form"
          disabled={isSubmitting}
          className="mx-auto mt-8 flex h-12 w-full max-w-[302px] items-center justify-center rounded-[15px] bg-[#0097ce] px-8 text-[17px] font-medium text-white transition hover:bg-[#0087b8] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#0097ce]/40 disabled:cursor-wait disabled:opacity-60"
        >
          {isSubmitting ? '생성 중' : '다음'}
        </button>
        {errorMessage ? (
          <p className="mt-4 break-keep text-center text-[14px] font-semibold leading-6 text-[#e24a4a]">
            {errorMessage}
          </p>
        ) : null}
      </section>
    </main>
  )
}

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message || fallback
  }

  return fallback
}
