export function formatImageUrl(url: string, width = 800): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) return url
  if (!url.includes('/upload/') || (!url.includes('res.cloudinary.com/') && !url.includes('cloudinary.com/'))) return url

  const marker = '/upload/'
  const markerIndex = url.indexOf(marker)
  if (markerIndex < 0) return url

  const suffix = url.slice(markerIndex + marker.length)
  if (/^f_auto[,/]/.test(suffix) || /^q_auto[,/]/.test(suffix) || /^w_\d+[,/]/.test(suffix)) return url
  return `${url.slice(0, markerIndex + marker.length)}f_auto,q_auto,w_${width}/${suffix}`
}
