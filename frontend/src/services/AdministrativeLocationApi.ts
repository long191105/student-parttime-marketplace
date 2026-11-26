export interface LocationOption {
  code: number
  name: string
}

interface ApiProvince extends LocationOption {
  wards: LocationOption[]
}

const API_BASE_URL = 'https://provinces.open-api.vn/api/v2'

let provinceCodeIndexPromise: Promise<Map<string, number>> | undefined

export async function getProvinceWards(
  provinceName: string,
  signal: AbortSignal,
): Promise<{ province: LocationOption; wards: LocationOption[] }> {
  const provinceCodes = await getProvinceCodeIndex()
  const provinceCode = provinceCodes.get(normalizeProvinceName(provinceName))
  if (provinceCode === undefined) {
    throw new Error(`Không tìm thấy mã tỉnh/thành "${provinceName}" trong danh mục địa giới.`)
  }

  const province = await requestJson(`${API_BASE_URL}/p/${provinceCode}/?depth=2`, signal)
  if (!isApiProvince(province)) {
    throw new Error('Danh mục phường/xã trả về dữ liệu không hợp lệ.')
  }
  return { province: { code: province.code, name: province.name }, wards: province.wards }
}

async function getProvinceCodeIndex(): Promise<Map<string, number>> {
  if (!provinceCodeIndexPromise) {
    provinceCodeIndexPromise = requestJson(`${API_BASE_URL}/`)
      .then((response) => {
        if (!Array.isArray(response) || !response.every(isLocationOption)) {
          throw new Error('Danh mục tỉnh/thành trả về dữ liệu không hợp lệ.')
        }
        return new Map(response.map((province) => [normalizeProvinceName(province.name), province.code]))
      })
      .catch((error: unknown) => {
        provinceCodeIndexPromise = undefined
        throw error
      })
  }
  return provinceCodeIndexPromise
}

async function requestJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error(`Không thể tải danh mục khu vực (HTTP ${response.status}).`)
  }
  return response.json() as Promise<unknown>
}

function isApiProvince(value: unknown): value is ApiProvince {
  return isRecord(value)
    && isLocationOption(value)
    && Array.isArray(value.wards)
    && value.wards.every(isLocationOption)
}

function isLocationOption(value: unknown): value is LocationOption {
  return isRecord(value) && Number.isInteger(value.code) && typeof value.name === 'string'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeProvinceName(name: string): string {
  return name
    .replace(/^(?:tỉnh|thành phố|tp\.?)\s*/i, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}
