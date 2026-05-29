import { useState, type ChangeEvent } from 'react'
import { FestStepProgress } from '../components/FestStepProgress'

const festivalFields = [
  { id: 'festival-name', label: '축제명', placeholder: '축제명을 입력하세요 ...' },
  { id: 'festival-host', label: '주최사', placeholder: '주최사를 입력하세요 ...' },
  { id: 'festival-place', label: '운영 장소', placeholder: '운영 장소를 입력하세요 ...' }
]

const allowedImageTypes = ['application/pdf', 'image/jpeg', 'image/png']

export function CreateFest() {
  const [imageName, setImageName] = useState('')

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      setImageName('')
      return
    }

    if (!allowedImageTypes.includes(file.type)) {
      window.alert('PDF, JPG, PNG 파일만 업로드할 수 있습니다.')
      event.target.value = ''
      setImageName('')
      return
    }

    setImageName(file.name)
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

          <form className="mt-2 rounded-[15px] border border-[#e0e0e0] px-6 py-7 sm:px-8">
            <div className="grid gap-x-14 gap-y-5 lg:grid-cols-2">
              {festivalFields.map((field) => (
                <div key={field.id}>
                  <label htmlFor={field.id} className="block text-[15px] font-bold leading-5">
                    {field.label}
                  </label>
                  <input
                    id={field.id}
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
                    aria-label="운영 시작일"
                    className="h-[33px] w-full rounded-[15px] border border-[#e0e0e0] bg-white px-[16px] text-[12px] outline-none transition focus:border-[#0097ce] focus:ring-4 focus:ring-[#0097ce]/15"
                    type="date"
                  />
                  <span className="text-[13px] font-bold text-[#454545]">~</span>
                  <input
                    id="festival-end-date"
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
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0097ce] text-xl font-semibold text-white"
                    aria-hidden="true"
                  >
                    +
                  </span>
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

        <a
          href="/managePass"
          className="mx-auto mt-8 flex h-12 w-full max-w-[302px] items-center justify-center rounded-[15px] bg-[#0097ce] px-8 text-[17px] font-medium text-white transition hover:bg-[#0087b8] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#0097ce]/40"
        >
          다음
        </a>
      </section>
    </main>
  )
}
