# Christmas Cards — Frontend Navidad Roja

Este paquete contiene la carpeta `src` modificada del frontend React + Vite que compartiste.
**Conserva el `package.json`, `index.html`, `vite.config.*`, `tailwind.config.*`, `tsconfig.*`, `node_modules` y `.env` de tu proyecto actual.** No reemplaza el backend ni la base de datos.

## Instalación

1. Si utilizas Git, guarda los cambios existentes en un commit o rama antes de reemplazar archivos.
2. Extrae el ZIP en la **raíz del frontend** (donde está `package.json`) y combina/reemplaza la carpeta `src`. No lo extraigas dentro de `src`, para evitar `src/src`.
3. Tu backend debe correr en `http://localhost:3000` y Vite en `http://localhost:5173` (de acuerdo con la configuración que probaste).
4. Revisa `.env` de Vite: `VITE_API_URL=http://localhost:3000` (sin barra al final). **El backend** debe tener `FRONTEND_URL=http://localhost:5173` para CORS y generación de invitaciones.
5. Ejecuta desde la raíz del frontend:

```powershell
npm install
npm run dev
```

Si existe script `build` en package.json, ejecuta `npm run build` y envía sus errores completos si aparece alguno. Este ZIP es únicamente el `src`: no incluye `package.json` ni dependencias, por eso no se hizo compilación final ni prueba end-to-end.

## Implementaciones

- Paleta morada/violeta/fucsia cambiada por rojos y rosados navideños en las pantallas existentes.
- Cliente `/home`: muestra grupos y eventos desde NestJS, crea grupo privado con invitación, obtiene QR, crea evento y realiza el sorteo como propietario, revela su asignación privada.
- Invitaciones públicas `/groups/join/:code`: acepta invitados sin cuenta o usuarios registrados.
- Invitados `/guests/participation/:groupId`: guarda token de invitado en el navegador, avatar Cloudinary, lista de deseos, consulta por ID de evento y puede marcar entrega de regalo. Un invitado necesita que el organizador comparta el ID del evento.
- Grupos admin: `GET /groups/admin`, imagen Cloudinary, QR, color del grupo, administración de invitados y miembros.
- Administración de tarjetas: imágenes por archivos multipart `front`, `background`, `preview`, después de guardar el registro.
- Administración de listas de deseos: fotografía del ítem mediante Cloudinary tras crearlo/editarlo.
- Admin usuarios: habilitada la subida y retirada de avatar de otro usuario (la UI existía pero estaba desactivada).
- Admin Amigo Secreto: subida de portada, copia de ID de evento y resultado `draw` conforme al contrato del backend (solo participantes; **no revelar parejas**).
- Cliente HTTP compartido que lee la variable `VITE_API_URL` y envía JWT o `x-guest-token` según corresponda.

## Pruebas recomendadas

1. Abrir `/`, `/login` y `/admin` con la sesión administradora.
2. Abrir `/admin/groups`, crear un grupo y subir una foto; abrir «Ver QR».
3. Abrir `http://localhost:5173/groups/join/TU_CODIGO` en pestaña privada; entrar como invitado y guardar lista de deseos.
4. Iniciar sesión con un usuario `client`, abrir `/home`, crear un grupo y obtener QR.
5. Con al menos tres miembros activos, crear evento, copiar ID, sortear y comprobar en `/home` o el panel de invitado que cada persona solo ve su propio destinatario.
6. Crear tarjeta y agregar JPG, PNG o WEBP hasta 5 MB; comprobar URL de Cloudinary.
7. Verificar que las fotos de perfil del admin se actualizan en el panel `/admin/users`.

## Limitaciones reales

- **No se recibió `package.json`, configuración Vite/Tailwind ni `index.html`**. Se revisó sintaxis TypeScript/TSX e importaciones relativas, pero **no se pudo compilar ni ejecutar el frontend completo**.
- La ruta frontend y CORS se configuran para el mismo host local. Un QR que contiene `localhost` **no funciona desde otro celular**: para probar con teléfono, configura una URL accesible en red local o URL pública en Vite y en `FRONTEND_URL` del backend; ajusta CORS y la URL de API del cliente.
- El invitado necesita conservar su acceso en el navegador. Si borra el almacenamiento local o usa otro dispositivo, ese token no se puede recuperar desde el backend; el organizador tendrá que crear otra invitación.
- Las restricciones de producción (rate-limiting/CAPTCHA para invitados públicos, entrega segura de tokens, endurecimiento de sesiones) siguen pendientes en backend.
- Los resultados del sorteo no se devuelven al administrador; se mantienen privados, conforme al backend.
- Algunos formularios o pantallas ajenos a este flujo pueden tener problemas previos que no se probaron de extremo a extremo.

## Seguridad

No publiques JWT ni tokens de invitado. Como se compartió un JWT en la conversación, trata ese token como expuesto. Puedes invalidar los JWT existentes mediante rotación de `JWT_SECRET` y reinicio del backend (desconectará sesiones), si corresponde a tu entorno.
