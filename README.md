# JotaCode - Netflix Code Monitor

Monitor de códigos de verificación de Netflix en tiempo real. Recibe y comparte códigos de geolocalización al instante con tus familiares.

## Funcionalidades

- **Monitoreo en tiempo real** - Revisa tu correo Hotmail/Outlook cada 30 segundos buscando correos de Netflix
- **Extracción automática de códigos** - Detecta códigos de verificación de 4-8 dígitos automáticamente
- **Enlaces de confirmación** - Extrae y muestra enlaces de confirmación de geolocalización
- **Clasificación inteligente** - Clasifica los correos por tipo: códigos, geolocalización, alertas de inicio de sesión
- **Protección con PIN** - Solo personas con el PIN pueden acceder al dashboard
- **Notificaciones del navegador** - Recibe alertas cuando llegue un nuevo código
- **Diseño responsive** - Funciona en móvil, tablet y desktop
- **Caché inteligente** - Guarda correos en base de datos local para acceso offline
- **Copiar código al portapapeles** - Un clic para copiar cualquier código

## Configuración

### 1. Contraseña de aplicación de Outlook

Para conectar con tu correo de Hotmail/Outlook necesitas una **contraseña de aplicación**:

1. Ve a [https://account.live.com/proofs/AppPassword](https://account.live.com/proofs/AppPassword)
2. Inicia sesión con tu cuenta de Microsoft
3. Crea una nueva contraseña de aplicación
4. Usa esta contraseña en la variable `IMAP_PASS`

### 2. Variables de entorno

Copia `.env.example` a `.env` y configura:

```env
DATABASE_URL=file:./db/custom.db
IMAP_USER=tu_correo@hotmail.com
IMAP_PASS=tu_contraseña_de_aplicacion
APP_PIN=7788
```

### 3. Instalación

```bash
npm install
# o
bun install
```

### 4. Base de datos

```bash
npx prisma db push
# o
bun run db:push
```

### 5. Ejecutar

```bash
npm run dev
# o
bun run dev
```

La aplicación estará disponible en `http://localhost:3000`

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
- **Prisma** - ORM de base de datos
- **imapflow** - Conexión IMAP
- **mailparser** - Parsing de correos

## Licencia

MIT
