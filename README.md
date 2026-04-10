# La Chacra – Dulces Artesanales 

> Este repositorio corresponde al backend del e-commerce La Chacra.
> El frontend se encuentra en un repositorio separado.

E-commerce orientado a mostrar productos regionales y ofrecer una experiencia visual artesanal, cuidada y accesible. Cuenta con carrito persistente, pagos integrados con Mercado Pago, panel de administración y stock sincronizado con Google Sheets.

🔗 Demo en producción: https://dulceslachacra.com


## Tecnologías utilizadas

### Frontend
- **Next.js 14 / App Router**
- **React 18**
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion** (animaciones)
- **Next/Image + picture** para optimización de imágenes
- **SEO metadata** integrada mediante `app/layout.tsx`

### Backend
- **Node.js**
- **Express.js**
- **REST API**
- **Mercado Pago SDK**
- **Resend (emails transaccionales)**


### Base de datos
- **PostgreSQL**
- **Railway (deploy backend + database)**

### Infraestructura
- **Railway (backend + DB)**
- **AWS S3 (almacenamiento de imágenes)**
- **Dominio real en producción**
- **GitHub Actions (CI / testing automático)**
- **Docker (entorno de ejecución reproducible)**

---
## ✨ Funcionalidades

- Carrito persistente con localStorage
- Control de stock en tiempo real
- Pagos con Mercado Pago
- Envío automático de emails de confirmación
- Panel de administración con login (sin registro)
- CRUD de productos
- Visualización de órdenes
- Stock sincronizado con Google Sheets de la clienta
- Notificaciones de acciones con toasts

---
## 🔐 Panel de administración

- Login manual (no hay registro público)
- Edición y gestión de productos
- Visualización de órdenes
- Control de stock

---
## 🔗 Integraciones

- Mercado Pago: pagos online
- Resend: emails transaccionales
- AWS S3: almacenamiento y entrega de imágenes de productos
- Google Sheets: stock sincronizado con clientas

---

## 🚀 Deploy

- Backend y base de datos desplegados en Railway
- Frontend en producción con dominio propio



## 🎨 Diseño
-Diseño responsive optimizado para mobile, tablet y desktop
- Componentes reutilizables: Navbar, Footer, WhatsApp Floating Button 
- Diseño UI/UX propio
- Animaciones suaves y accesibles para productos (Framer Motion)
- Edición de fotografías de producto
- Enfoque en experiencia de compra simple y clara
- Buenas prácticas de accesibilidad (alt text, estructura semántica, contraste revisado).  
- Metadata básica para SEO.

---

## Instalación

Clonar el repositorio:

```bash
git clone https://github.com/tu-usuario/la-chacra.git
cd la-chacra
```
## Instalar dependencias:
```bash
npm install
```
## Scripts disponibles

Iniciar el servidor de desarrollo:
```bash
npm run dev
```

## Construir para producción:
```bash
npm run build

```

## Correr el servidor en producción:
```bash
npm start
```

## Formatear con Prettier:
```bash
npm run format
```

---
## 🧪 Testing

El proyecto cuenta con tests de integración utilizando base de datos real y mocks para servicios externos.

### Tecnologías
- Vitest
- Supertest
- Prisma (DB de testing)

### Características
- Base de datos aislada para tests
- Mocks globales para:
  - AWS S3
  - Emails (Resend)
  - Mercado Pago
- Tests idempotentes (webhooks)
- Reseteo de base de datos entre tests

### Ejecutar tests

```bash
npm run test:run

---

```md
## 🐳 Docker

El backend puede ejecutarse en contenedores Docker para entornos de producción.

### Build de la imagen

```bash
docker build -t la-chacra-backend .

---

```md
## ⚙️ CI (Integración Continua)

El proyecto utiliza GitHub Actions para ejecutar tests automáticamente.

### Flujo

- Se ejecuta en:
  - push a `main` y `develop`
  - pull requests a `main`
- Levanta una base de datos PostgreSQL en contenedor
- Ejecuta migraciones
- Corre todos los tests

### Objetivo

- Detectar errores antes de deploy
- Garantizar estabilidad del backend
## SEO
```
El proyecto incluye:

- metadata en layout.tsx
- Etiqueta: <!DOCTYPE html><html lang="es">
- Alt text descriptivo en todas las imágenes
- Jerarquía correcta de títulos (h1, h2, h3)
- Contenido optimizado para buscadores

## 📷 Capturas

### Home
![Home](/public/screenshots/home.png)

### Productos
![Productos](/public/screenshots/products.png)

### Carrito
![Carrito](/public/screenshots/cart.png)

### Panel Admin
![Admin](/public/screenshots/admin.png)

### Mercado Pago
![Mercado Pago](/public/screenshots/mercado-pago.png)
