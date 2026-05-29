export function isPreviewableImage(file: File) {
  return file.type === 'image/jpeg' || file.type === 'image/png'
}

export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.addEventListener('load', () => {
      resolve(typeof reader.result === 'string' ? reader.result : '')
    })
    reader.addEventListener('error', () => {
      reject(reader.error ?? new Error('Failed to read file.'))
    })
    reader.readAsDataURL(file)
  })
}
