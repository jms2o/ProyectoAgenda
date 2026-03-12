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
