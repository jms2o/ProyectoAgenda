import { readFileSync } from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const uid = process.argv[2]
const serviceAccountPath = process.argv[3] || './service-account.json'

if (!uid) {
  console.error('Uso: node makeAdmin.mjs <UID> [ruta-service-account.json]')
  process.exit(1)
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'))

initializeApp({
  credential: cert(serviceAccount),
})

await getAuth().setCustomUserClaims(uid, { admin: true })
await getAuth().revokeRefreshTokens(uid)

console.log(`Admin asignado a UID: ${uid}`)
