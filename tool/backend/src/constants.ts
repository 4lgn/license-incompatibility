if (!process.env.DB_PASS) console.warn('Warning: No database password set!')
export const DB_PASS = process.env.DB_PASS || ''

if (!process.env.DB_NAME) console.warn('Warning: No database name set!')
export const DB_NAME = process.env.DB_NAME || ''

export const DB_PORT = process.env.DB_PORT || 7687
export const SERVER_PORT = process.env.SERVER_PORT || 5000
