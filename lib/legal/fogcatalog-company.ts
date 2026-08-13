export const FOGCATALOG_COMPANY = {
    legalName: 'Burcu Aldığ',
    taxNumber: '0510559196',
    taxOffice: 'Nilüfer V.D.',
    email: 'info@fogcatalog.com',
    phone: '+90 545 395 42 03',
    addressLine1: '23 Nisan Mah. 241. Sk. No: 8 İç Kapı No: 42',
    addressLine2Tr: 'Nilüfer / BURSA / TÜRKİYE',
    addressLine2En: 'Nilüfer / BURSA / TURKEY',
    cityDistrict: 'Nilüfer, Bursa',
    website: 'https://www.fogcatalog.com',
} as const

export const FOGCATALOG_LEGAL_ADDRESS =
    `${FOGCATALOG_COMPANY.addressLine1} ${FOGCATALOG_COMPANY.addressLine2Tr}`

export const FOGCATALOG_LEGAL_ADDRESS_HTML_TR =
    `${FOGCATALOG_COMPANY.addressLine1}<br />${FOGCATALOG_COMPANY.addressLine2Tr}`

export const FOGCATALOG_LEGAL_ADDRESS_HTML_EN =
    `${FOGCATALOG_COMPANY.addressLine1}<br />${FOGCATALOG_COMPANY.addressLine2En}`
