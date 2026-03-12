# Agenda QDS

Aplicación React + Vite para agenda pública y dashboard administrativo con Firebase.

## Desarrollo local

```bash
npm install
npm run dev
```

## Variables de entorno

Copia `.env.example` a `.env` y coloca tus credenciales de Firebase:

```bash
cp .env.example .env
```

Variables soportadas:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Deploy en Hostinger Business/Cloud

### Opción A: Deploy de Web App (recomendado en Business/Cloud)

1. En hPanel entra a `Websites` y crea/abre tu Web App.
2. Usa **Deploy Now**.
3. Conecta tu repo de GitHub o sube un ZIP del proyecto.
4. Configura:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Agrega las variables `VITE_FIREBASE_*` en el apartado de Environment Variables.
6. Ejecuta deploy y prueba `/`, `/login`, `/dashboard`.

### Opción B: Deploy estático por `public_html`

1. Genera build:
   ```bash
   npm run build
   ```
2. Sube el contenido de `dist/` a `public_html`.
3. El archivo `public/.htaccess` se copia a `dist/.htaccess` para soportar rutas SPA (`/login`, `/dashboard`).

## Checklist de producción

1. En Firebase Authentication agrega tu dominio a `Authorized domains`:
   - `tudominio.com`
   - `www.tudominio.com`
2. Verifica SSL activo en Hostinger.
3. Confirma que login y logout funcionen en el dominio final.

## Seguridad recomendada (admin)

Este proyecto incluye reglas endurecidas en `firestore.rules`.

1. Pega el contenido en Firebase:
   - Firebase Console > Firestore Database > Rules > Publish.
2. Asigna claim de admin al usuario autorizado.

Ejemplo con `firebase-admin` (ejecutar una sola vez):

```js
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import serviceAccount from './service-account.json' assert { type: 'json' }

initializeApp({ credential: cert(serviceAccount) })

await getAuth().setCustomUserClaims('UID_DEL_ADMIN', { admin: true })
console.log('Claim admin asignado')
```

Nota: despues de asignar claims, cierra sesion y vuelve a iniciar para refrescar token.
