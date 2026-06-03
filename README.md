# JotaCode - Netflix Code Monitor

Monitor de códigos de verificación de Netflix en tiempo real. Recibe y comparte códigos de geolocalización al instante con tus familiares.

## Funcionalidades

- **Monitoreo en tiempo real** - Revisa tu correo Gmail cada 30 segundos buscando correos de Netflix
- **Extracción automática de códigos** - Detecta códigos de verificación de 4-8 dígitos automáticamente
- **Enlaces de confirmación** - Extrae y muestra enlaces de confirmación de geolocalización
- **Clasificación inteligente** - Clasifica los correos por tipo: códigos, geolocalización, alertas de inicio de sesión
- **Protección con PIN** - Solo personas con el PIN pueden acceder al dashboard
- **Notificaciones del navegador** - Recibe alertas cuando llegue un nuevo código
- **Diseño responsive** - Funciona en móvil, tablet y desktop
- **Caché inteligente** - Guarda correos en base de datos para acceso offline
- **Copiar código al portapapeles** - Un clic para copiar cualquier código

## Despliegue en Vercel

### Paso 1: Conecta el repo

1. Ve a [vercel.com](https://vercel.com) y haz login
2. Click en **"Add New Project"**
3. Importa el repo `HacheJotaDev/JotaPro`
4. Framework: **Next.js** (se detecta automáticamente)

### Paso 2: Crea una base de datos PostgreSQL

Usa [Neon](https://neon.tech) (gratis, sin tarjeta de crédito):

1. Crea una cuenta en [neon.tech](https://neon.tech)
2. Crea un nuevo proyecto
3. Copia la **connection string** que te da (algo como `postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require`)

### Paso 3: Configura las variables de entorno en Vercel

En tu proyecto de Vercel ve a **Settings > Environment Variables** y agrega estas 5 variables:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | `postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require` |
| `DIRECT_URL` | `postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require` (igual que arriba) |
| `IMAP_USER` | `henryofc17@gmail.com` |
| `IMAP_PASS` | `xdohiqffrtfcndiz` |
| `APP_PIN` | `7788` |

### Paso 4: Deploy

Click en **"Deploy"** y listo. Vercel detecta Next.js y configura todo automáticamente.

### Paso 5: Push del schema a la base de datos

Después del primer deploy, necesitas crear las tablas en la base de datos. En tu terminal local:

```bash
# Instala Vercel CLI si no lo tienes
npm i -g vercel

# Conecta tu proyecto local
vercel link

# Descarga las variables de entorno
vercel env pull .env

# Push del schema a la base de datos
npx prisma db push
```

## Habilitar IMAP en Gmail

Si necesitas crear una nueva contraseña de aplicación:

1. Ve a [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Selecciona "Correo" como app
3. Genera la contraseña
4. Usa los 16 caracteres (sin espacios) como `IMAP_PASS`

**Nota:** Tu cuenta de Google debe tener verificación en 2 pasos activada para generar contraseñas de aplicación.

## Uso

1. Abre la URL que te da Vercel
2. Ingresa el PIN: **7788**
3. El dashboard mostrará los correos de Netflix con códigos
4. Comparte la URL y el PIN con tus familiares para que puedan ver los códigos

## Tecnologías

- **Next.js 16** - Framework de React
- **TypeScript** - Tipado estático
- **Tailwind CSS 4** - Estilos
- **shadcn/ui** - Componentes UI
- **Prisma** - ORM de base de datos (PostgreSQL)
- **imapflow** - Conexión IMAP a Gmail
- **mailparser** - Parsing de correos

## Licencia

MIT
