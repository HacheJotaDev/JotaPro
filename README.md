# JotaCode - Netflix Code Monitor

Monitor de códigos de verificación de Netflix en tiempo real. Recibe y comparte códigos de geolocalización al instante con tus familiares.

![JotaCode Dashboard](https://img.shields.io/badge/JotaCode-v1.0-red?style=for-the-badge&logo=netflix)

## Funcionalidades

- **Monitoreo en tiempo real** - Revisa tu correo Hotmail/Outlook cada 30 segundos buscando correos de Netflix
- **Extracción automática de códigos** - Detecta códigos de verificación de 4-8 dígitos automáticamente
- **Enlaces de confirmación** - Extrae y muestra enlaces de confirmación de geolocalización
- **Clasificación inteligente** - Clasifica los correos por tipo: códigos, geolocalización, alertas de inicio de sesión
- **Protección con PIN** - Solo personas con el PIN pueden acceder al dashboard
- **Notificaciones del navegador** - Recibe alertas cuando llegue un nuevo código
- **Diseño responsive** - Funciona en móvil, tablet y desktop
- **Caché inteligente** - Guarda correos en base de datos para acceso offline
- **Copiar código al portapapeles** - Un clic para copiar cualquier código

## Despliegue en Vercel

### 1. Fork o clona este repositorio

### 2. Crea una base de datos PostgreSQL

Usa cualquiera de estos servicios gratuitos:
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Neon](https://neon.tech)
- [Supabase](https://supabase.com)

### 3. Configura las variables de entorno en Vercel

Ve a **Settings > Environment Variables** en tu proyecto de Vercel y agrega:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | URL de conexión PostgreSQL (pooling) | `postgresql://user:pass@host.neon.tech/db?sslmode=require` |
| `DIRECT_URL` | URL de conexión PostgreSQL (directa) | `postgresql://user:pass@host.neon.tech/db?sslmode=require` |
| `IMAP_USER` | Tu correo de Hotmail/Outlook | `tu_correo@hotmail.com` |
| `IMAP_PASS` | Contraseña de aplicación de Outlook | `abcd efgh ijkl mnop` |
| `APP_PIN` | PIN de acceso al dashboard | `7788` |

### 4. Obtener la contraseña de aplicación de Outlook

1. Ve a [https://account.live.com/proofs/AppPassword](https://account.live.com/proofs/AppPassword)
2. Inicia sesión con tu cuenta de Microsoft
3. Crea una nueva contraseña de aplicación
4. Usa esta contraseña en la variable `IMAP_PASS`

### 5. Deploy

```bash
# Con Vercel CLI
vercel --prod

# O simplemente conecta tu repo de GitHub en vercel.com
```

Vercel detectará automáticamente Next.js y configurará el build.

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Configurar .env (copia .env.example)
cp .env.example .env
# Edita .env con tus credenciales

# Push del schema a la base de datos
npx prisma db push

# Ejecutar en desarrollo
npm run dev
```

## Uso

1. Abre la web en tu navegador
2. Ingresa el PIN configurado (`APP_PIN`)
3. El dashboard mostrará los correos de Netflix con códigos
4. Comparte la URL y el PIN con tus familiares para que puedan ver los códigos

## Tecnologías

- **Next.js 16** - Framework de React
- **TypeScript** - Tipado estático
- **Tailwind CSS 4** - Estilos
- **shadcn/ui** - Componentes UI
- **Prisma** - ORM de base de datos (PostgreSQL)
- **imapflow** - Conexión IMAP
- **mailparser** - Parsing de correos

## Licencia

MIT
