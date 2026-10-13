# Backend NestJS — Grupos, tarjetas, QR, Cloudinary e invitados

Se modificó el `src` recibido y se dejaron intactos los módulos ajenos al alcance. **Es una entrega de código para integrar y probar**, no una afirmación de que haya sido validada con tu PostgreSQL o Cloudinary reales.

## Instalación en tu proyecto real

1. Respaldar la base PostgreSQL y tu carpeta `src` actual.
2. Copiar el contenido de la carpeta `src/` de este paquete sobre la carpeta `src/` de tu backend (conservar tu `package.json`, `tsconfig.json`, `.env` y resto del proyecto).
3. Desde la raíz del backend:

   ```powershell
   npm install qrcode
   npm install -D @types/qrcode
   ```

4. Confirmar `.env` (sin compartir credenciales): `FRONTEND_URL=http://localhost:5173`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `JWT_SECRET`, `DB_*`.
5. **Con `DB_SYNCHRONIZE=false`**, ejecutar UNA vez `migrations/20261012_group_images_guests.sql` en pgAdmin Query Tool, sobre una base respaldada. No mantener `synchronize=true` en producción. Si TypeORM ya creó manualmente campos en un ambiente de prueba, inspeccionar el esquema antes de aplicar el SQL.
6. Reiniciar NestJS (`npm run start:dev`) y verificar rutas. Ejecutar `npm run build`; cualquier error debe comprobarse con las dependencias y tsconfig reales que no estaban incluidos en el RAR.

**Importante:** el RAR compartido incluye únicamente `src`; no incluye package.json, node_modules, variables de entorno, migraciones existentes ni tests. No se ha levantado la base ni se ha comprobado la conectividad externa con Cloudinary.

## Endpoints para Insomnia

Todos los que digan **JWT** llevan `Authorization: Bearer <accessToken>`. Los que digan **guest** llevan `x-guest-token: <guestToken>` (no JWT). Imagen: `multipart/form-data`, campo **file**, JPG/PNG/WEBP hasta 5 MB.

| Operación | Endpoint | Acceso |
|---|---|---|
| Crear grupo con enlace de invitación | `POST /groups` | JWT |
| QR actual para compartir (`qrDataUrl`) | `GET /groups/:id/invitation/qr` | Creador o admin global |
| Subir o reemplazar foto de grupo | `POST /groups/:id/image` | Creador o admin global |
| Quitar foto de grupo | `DELETE /groups/:id/image` | Creador o admin global |
| Regenerar invitación / invalidar QR anterior | `PATCH /groups/:id/invitation` | Creador o admin global |
| Previsualizar invitación | `GET /groups/invitation/:code` | Público |
| Unirse con cuenta por invitación | `POST /groups/invitation/:code/join` | JWT |
| Unirse como invitado con nombre | `POST /groups/invitation/:code/guests` | Público; `{ "name": "Camila" }` |
| Añadir invitado manualmente | `POST /groups/:id/guests` | Administrador del grupo; `{ "name": "Luis" }` |
| Consultar invitado | `GET /guests/me` | guest |
| Guardar deseos de invitado | `PUT /guests/me/wishlist` | guest; `{ "items": [{ "name": "Libro", "productUrl": "https://example.com/libro", "note": "Edición 2026" }] }` |
| Subir avatar de invitado | `POST /guests/me/avatar` | guest; multipart `file` |
| Ver solicitudes pendientes | `GET /groups/:groupId/members/pending` | Administrador del grupo |
| Aprobar usuario registrado | `PATCH /groups/:groupId/members/:userId/approve` | Administrador del grupo |
| Aprobar invitado | `PATCH /groups/:groupId/guests/:guestMemberId/approve` | Administrador del grupo |
| Eliminar invitado | `DELETE /groups/:groupId/guests/:guestMemberId` | Administrador del grupo |
| Crear tarjeta sin URL de imagen | `POST /cards` | JWT; `{ "name": "Navidad", "category": "christmas" }` |
| Subir foto de tarjeta | `POST /cards/:id/images/:slot` | Creador o admin global; `slot=front,background,preview` |
| Eliminar foto de tarjeta | `DELETE /cards/:id/images/:slot` | Creador o admin global |
| Subir imagen de deseo | `POST /wishlists/:wishlistId/items/:itemId/image` | Propietario JWT |
| Quitar imagen de deseo | `DELETE /wishlists/:wishlistId/items/:itemId/image` | Propietario JWT |
| Cambiar foto de otro usuario | `POST /users/:id/avatar` | Admin global; multipart `file` |
| Quitar foto de otro usuario | `DELETE /users/:id/avatar` | Admin global |
| Todos los grupos | `GET /groups/admin` | Admin global |
| Todas las tarjetas | `GET /cards/admin` | Admin global |
| Imagen de portada del evento | `POST /secret-santa-events/:id/image` | Admin del grupo JWT; multipart `file` |
| Quitar portada del evento | `DELETE /secret-santa-events/:id/image` | Admin del grupo JWT |
| Crear evento Amigo Secreto | `POST /secret-santa-events` | Admin del grupo JWT |
| Realizar sorteo con registrados e invitados | `POST /secret-santa-assignments/event/:eventId/draw` | Admin del grupo JWT |
| Ver a quién regalar y sus deseos | `GET /secret-santa-assignments/event/:eventId/me` | Participante registrado JWT |
| Invitado ve su asignación y deseos | `GET /secret-santa-guests/event/:eventId/me` | guest |
| Invitado marca regalo entregado | `PATCH /secret-santa-guests/event/:eventId/delivered` | guest |

Los grupos incluyen `themeColor` (hexadecimal `#RRGGBB`) para un diseño personalizable.

La URL del QR es una ruta de **frontend** `/groups/join/:code` — hay que crear esa pantalla para mostrar el grupo y los botones “Entrar con cuenta” y “Entrar como invitado”. El backend no construye esa pantalla. El QR se genera mediante `qrcode` y se devuelve como PNG en un `data:image/png;base64,...`; por ser una imagen calculada a partir de la URL y no un archivo del usuario, no se guarda en Cloudinary. Tras regenerar la invitación, generar y compartir el QR nuevo.

**Flujo de ejemplo:** registrar/login → crear grupo → QR → otros se unen registrados o sin cuenta → cada uno prepara su lista de deseos → administrador crea el evento → sortea con mínimo 3 participantes activos → cada quien consulta su asignación privada. Las listas de usuarios registrados solo se muestran al receptor del sorteo si su visibilidad es `groups` o `public`.

## Notas y limitaciones

- Un invitado no es una cuenta. Su token **solo se muestra al crearlo**; la pantalla debe mostrarlo/guardarlo privadamente. Si lo pierde, el organizador deberá crear una invitación nueva (no se puede recuperar el token desde la BD: solo se almacena SHA-256). Nunca imprimirlo en logs.
- En grupos `approval`, el invitado queda `pending` hasta aprobación. Un grupo `closed` no permite autoinscripción.
- Aún no se añadió limitación por IP/CAPTCHA a la creación pública de invitados. Antes de publicar la app, usar protección anti-spam (`@nestjs/throttler` o equivalente), controles de concurrencia de cupo y supervisar abuso.
- Para el mismo usuario la administración de sus listas de deseos sigue su ruta existente. Los invitados usan una lista simple JSONB sin fotografías por ítem; sus avatares sí se guardan en Cloudinary.
- No modificar miembros/participación de eventos ya sorteados sin definir antes una regla de cancelación o nuevo sorteo; las asignaciones existentes permanecen asociadas a la membresía original.
- Las imágenes de tarjetas ahora se suben después de crear la tarjeta, que puede crearse sin imagen. Los DTO ya no aceptan campos `imageUrl` y la URL la asigna Cloudinary. Algunas URLs antiguas se mantienen en BD para no perder imágenes históricas.
- Si el proyecto tiene registros históricos o constraints personalizados, revisar la migración con pgAdmin antes de aplicarla.

## Revisión antes de integrar (13 de octubre de 2026)

Se ajustaron tres detalles para la integración: `GET /groups/me` incluye ahora grupos activos privados y grupos a los que el usuario se unió; `GET /cards/my` ya no oculta tarjetas cuando tienen imágenes; la migración no agrega una columna `theme_color` innecesaria a `wishlist_items`. Este paquete corregido reemplaza el primer ZIP entregado.
