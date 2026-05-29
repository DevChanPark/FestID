import { useState, type ChangeEvent, type FormEvent } from 'react'
import { isPreviewableImage, readFileAsDataUrl } from '../lib/filePreview'
import { saveSubmittedAdminInfo } from '../lib/localState'

const fields: Array<{ id: string; name: string; label: string; placeholder: string; type?: string }> = [
  { id: 'admin-name', name: 'name', label: '이름', placeholder: '이름을 입력하세요 ...' },
  { id: 'admin-email', name: 'email', label: '이메일', placeholder: '이메일을 입력하세요 ...', type: 'email' },
  { id: 'admin-role', name: 'role', label: '직책', placeholder: '직책을 입력하세요 ...' },
  { id: 'admin-org', name: 'organization', label: '소속 기관', placeholder: '소속 기관을 입력하세요 ...' }
]

const allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png']

export function SubmitInfo({
  onSubmitted = (path: string) => window.location.assign(path)
}: {
  onSubmitted?: (path: string) => void
}) {
  const [selectedFileName, setSelectedFileName] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      setSelectedFileName('')
      setPreviewUrl('')
      return
    }

    if (!allowedFileTypes.includes(file.type)) {
      window.alert('PDF, JPG, PNG 파일만 업로드할 수 있습니다.')
      event.target.value = ''
      setSelectedFileName('')
      setPreviewUrl('')
      return
    }

    setSelectedFileName(file.name)
    setPreviewUrl(isPreviewableImage(file) ? await readFileAsDataUrl(file) : '')
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedFileName) {
      window.alert('관리자 증빙 자료를 업로드해주세요.')
      return
    }

    const formData = new FormData(event.currentTarget)

    saveSubmittedAdminInfo({
      name: String(formData.get('name') || ''),
      email: String(formData.get('email') || ''),
      role: String(formData.get('role') || ''),
      organization: String(formData.get('organization') || ''),
      proofFileName: selectedFileName,
      proofFilePreviewUrl: previewUrl
    })

    onSubmitted('/waitVC')
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
                  type={field.type ?? 'text'}
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="mx-auto mt-0 flex h-12 w-full max-w-[479px] items-center justify-center rounded-[15px] bg-[#0097ce] px-8 text-[17px] font-medium text-white transition hover:bg-[#0087b8] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#0097ce]/40 lg:col-span-2 lg:mt-0"
          >
            관리자 VC 발급 요청
          </button>
        </form>
      </section>
    </main>
  )
}
