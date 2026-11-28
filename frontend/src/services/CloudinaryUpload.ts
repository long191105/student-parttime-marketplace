const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export class CloudinaryUploadError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'CloudinaryUploadError'
  }
}

export function validateCloudinaryImage(file: File): void {
  if (!SUPPORTED_TYPES.has(file.type)) {
    throw new CloudinaryUploadError(`${file.name}: chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.`)
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new CloudinaryUploadError(`${file.name}: ảnh có dung lượng tối đa 5 MB.`)
  }
}

export async function uploadImageToCloudinary(file: File): Promise<string> {
  validateCloudinaryImage(file)

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  if (!cloudName || !uploadPreset) {
    throw new CloudinaryUploadError('Thiếu cấu hình Cloudinary. Hãy thiết lập VITE_CLOUDINARY_CLOUD_NAME và VITE_CLOUDINARY_UPLOAD_PRESET.')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)

  let response: Response
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    })
  } catch (error) {
    throw new CloudinaryUploadError(`Không thể kết nối Cloudinary để tải ${file.name}.`, { cause: error })
  }

  if (!response.ok) {
    let detail = ''
    try {
      const body = await response.json() as { error?: { message?: string } }
      detail = body.error?.message ? ` ${body.error.message}` : ''
    } catch {
      // Keep a generic upload error if Cloudinary does not return JSON.
    }
    throw new CloudinaryUploadError(`Không thể tải ${file.name}.${detail}`)
  }

  const result = await response.json() as { secure_url?: string }
  if (!result.secure_url?.startsWith('https://')) {
    throw new CloudinaryUploadError(`Cloudinary không trả về URL an toàn cho ${file.name}.`)
  }
  return result.secure_url
}

export async function uploadImagesToCloudinary(files: File[]): Promise<string[]> {
  return Promise.all(files.map((file) => uploadImageToCloudinary(file)))
}

const MAX_CHAT_IMAGE_SIZE = 10 * 1024 * 1024
const MAX_CHAT_VIDEO_SIZE = 50 * 1024 * 1024

export async function uploadChatMediaToCloudinary(file: File): Promise<{ url: string; mediaType: 'IMAGE' | 'VIDEO' }> {
  const isImage = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
  const isVideo = ['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type)
  if (!isImage && !isVideo) {
    throw new CloudinaryUploadError(`${file.name}: chỉ hỗ trợ ảnh JPG, PNG, WebP hoặc video MP4, WebM, MOV.`)
  }
  if (isImage && file.size > MAX_CHAT_IMAGE_SIZE) {
    throw new CloudinaryUploadError(`${file.name}: ảnh có dung lượng tối đa 10 MB.`)
  }
  if (isVideo && file.size > MAX_CHAT_VIDEO_SIZE) {
    throw new CloudinaryUploadError(`${file.name}: video có dung lượng tối đa 50 MB.`)
  }

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  if (!cloudName || !uploadPreset) {
    throw new CloudinaryUploadError('Thiếu cấu hình Cloudinary. Hãy thiết lập VITE_CLOUDINARY_CLOUD_NAME và VITE_CLOUDINARY_UPLOAD_PRESET.')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)
  const resourceType = isVideo ? 'video' : 'image'
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    let detail = ''
    try {
      const body = await response.json() as { error?: { message?: string } }
      detail = body.error?.message ? ` ${body.error.message}` : ''
    } catch {
      // Keep a generic upload error if Cloudinary does not return JSON.
    }
    throw new CloudinaryUploadError(`Không thể tải ${file.name}.${detail}`)
  }

  const result = await response.json() as { secure_url?: string }
  if (!result.secure_url?.startsWith('https://')) {
    throw new CloudinaryUploadError(`Cloudinary không trả về URL an toàn cho ${file.name}.`)
  }
  return { url: result.secure_url, mediaType: isVideo ? 'VIDEO' : 'IMAGE' }
}
