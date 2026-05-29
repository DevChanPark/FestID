import { useState, type ChangeEvent, type FormEvent } from 'react'
import { createAdminProfile, uploadFile } from '../lib/adminApi'
import { ApiError } from '../lib/api'
import { isPreviewableImage, readFileAsDataUrl } from '../lib/filePreview'
import { saveSubmittedAdminInfo } from '../lib/localState'

const fields: Array<{ id: string; name: string; label: string; placeholder: string }> = [
  { id: 'admin-school', name: 'schoolName', label: '학교명', placeholder: '학교명을 입력하세요 ...' },
  { id: 'admin-org', name: 'organizationName', label: '소속 기관', placeholder: '소속 기관을 입력하세요 ...' },
  { id: 'admin-department', name: 'department', label: '부서', placeholder: '부서를 입력하세요 ...' },
  { id: 'admin-position', name: 'position', label: '직책', placeholder: '직책을 입력하세요 ...' },
  { id: 'admin-role', name: 'role', label: '담당 역할', placeholder: '담당 역할을 입력하세요 ...' }
]

const allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png']

export function SubmitInfo({
  onSubmitted = (path: string) => window.location.assign(path)
}: {
  onSubmitted?: (path: string) => void
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFileName, setSelectedFileName] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      setSelectedFile(null)
      setSelectedFileName('')
      setPreviewUrl('')
      return
    }

    if (!allowedFileTypes.includes(file.type)) {
      window.alert('PDF, JPG, PNG 파일만 업로드할 수 있습니다.')
      event.target.value = ''
      setSelectedFile(null)
      setSelectedFileName('')
      setPreviewUrl('')
      return
    }

    setSelectedFile(file)
    setSelectedFileName(file.name)
    setPreviewUrl(isPreviewableImage(file) ? await readFileAsDataUrl(file) : '')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')

    if (!selectedFile) {
      window.alert('관리자 증빙 자료를 업로드해주세요.')
      return
    }

    const formData = new FormData(event.currentTarget)
    const schoolName = String(formData.get('schoolName') || '').trim()
    const organizationName = String(formData.get('organizationName') || '').trim()
    const department = String(formData.get('department') || '').trim()
    const position = String(formData.get('position') || '').trim()
    const role = String(formData.get('role') || '').trim()

    if (!schoolName || !organizationName || !role) {
      setErrorMessage('학교명, 소속 기관, 담당 역할은 필수입니다.')
      return
    }

    setIsSubmitting(true)

    try {
      const uploadedFile = await uploadFile('admin-proof', selectedFile)

      await createAdminProfile({
        schoolName,
        organizationName,
        department,
        position,
        role,
        proofFileUrl: uploadedFile.fileUrl
      })

      saveSubmittedAdminInfo({
        schoolName,
        organizationName,
        department,
        position,
        role,
        proofFileName: selectedFileName,
        proofFilePreviewUrl: previewUrl
      })

      onSubmitted('/waitVC')
    } catch (error) {
      setErrorMessage(toErrorMessage(error, '관리자 프로필 제출에 실패했습니다.'))
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
        aria-labelledby="submit-info-title"
        className="mx-auto mt-9 w-full max-w-[1076px] rounded-[30px] bg-white px-8 py-10 shadow-panel sm:px-14 lg:min-h-[765px] lg:rounded-[38px]"
      >
        <div>
          <h2
            id="submit-info-title"
            className="break-keep text-[25px] font-bold leading-[1.45] tracking-normal sm:text-[31px]"
          >
            관리자 정보 입력 및 자료 제출
          </h2>
          <p className="mt-1 break-keep text-[15px] leading-relaxed text-[#313131]">
            관리자임을 증명할 수 있는 정보와 자료를 제출해주세요.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 grid gap-8 lg:grid-cols-[360px_1fr] lg:gap-[66px]"
          data-testid="submit-info-form"
        >
          <div>
            <label className="flex min-h-[478px] w-full cursor-pointer flex-col items-center justify-center rounded-[15px] border border-[#e3e3e3] bg-[#fafafa] px-8 text-center transition hover:border-[#0097ce] hover:bg-[#f4fbfe]">
              <input
                className="sr-only"
                type="file"
                accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="증명 자료 미리보기"
                  className="h-56 w-full max-w-[280px] rounded-[12px] object-cover shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-[#0097ce] text-2xl font-semibold text-[#0097ce]">
                  +
                </span>
              )}
              <span className="mt-4 max-w-full break-all text-[17px] font-bold">
                {selectedFileName || '증명 자료를 업로드 해주세요.'}
              </span>
              <span className="mt-2 text-[14px] text-[#6f6f6f]">PDF, JPG, PNG 파일만 업로드</span>
            </label>
          </div>

          <div className="space-y-5 lg:pt-[2px]">
            {fields.map((field) => (
              <div key={field.id}>
                <label htmlFor={field.id} className="block text-[20px] font-bold leading-none">
                  {field.label}
                </label>
                <input
                  id={field.id}
                  name={field.name}
                  className="mt-3 h-[72px] w-full rounded-[15px] border border-[#e0e0e0] bg-white px-8 text-[15px] outline-none transition placeholder:text-[#8a8a8a] focus:border-[#0097ce] focus:ring-4 focus:ring-[#0097ce]/15"
                  placeholder={field.placeholder}
                  type="text"
                />
              </div>
            ))}
            {errorMessage ? (
              <p className="break-keep text-[14px] font-semibold leading-6 text-[#e24a4a]">
                {errorMessage}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mx-auto mt-0 flex h-12 w-full max-w-[479px] items-center justify-center rounded-[15px] bg-[#0097ce] px-8 text-[17px] font-medium text-white transition hover:bg-[#0087b8] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#0097ce]/40 disabled:cursor-wait disabled:opacity-60 lg:col-span-2 lg:mt-0"
          >
            {isSubmitting ? '제출 중' : '관리자 VC 발급 요청'}
          </button>
        </form>
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
