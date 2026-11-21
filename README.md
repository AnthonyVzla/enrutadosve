# EnRuta2 · Traslados de personas

EnRuta2 es una PWA y aplicación Android para solicitar y operar traslados de personas en carro o moto. Conserva las cuentas y el proyecto Supabase de A un paso; las órdenes comerciales anteriores permanecen en la base de datos, pero la aplicación y las funciones de escritura nuevas se limitan a traslados.

## Android y ubicación

Capacitor usa el ID `com.enruta2.app`; se instala como una aplicación separada de A un paso. La ubicación se comparte únicamente cuando el conductor activa su disponibilidad y concede permisos. Android puede mostrar una notificación persistente mientras se comparte la ubicación; concede ubicación precisa y en segundo plano, y desactiva la optimización de batería si el fabricante lo requiere. Al desconectarse o cerrar sesión se detiene el seguimiento.

La compilación automática está en `.github/workflows/android-apk.yml`; ejecuta **Build Android APK** y descarga `enruta2-debug-apk`. Para sincronizar o compilar localmente:

```powershell
npm ci
npm run android:sync
npm run android:build-debug
npx cap open android
```

La aplicación web es estática y se publica en GitHub Pages; Supabase proporciona autenticación, datos, RLS, RPC y actualizaciones en tiempo real.

## Configuración de Supabase

1. En el proyecto Supabase existente `ibclzcikkxhdnorcbfoe`, ejecuta el `supabase/schema.sql` actualizado antes de publicar la app. Es re-ejecutable y añade categorías de vehículo, tarifas y RPC de mapas/seguimiento; conserva registros históricos. No se puede activar el seguimiento, la disponibilidad ni los enlaces familiares hasta aplicar este esquema.
2. En **Authentication → Providers → Email**, desactiva **Confirm email** antes de registrar usuarios. La interfaz pide usuario y contraseña; internamente usa el alias técnico `usuario@users.aunpaso.local`.
3. Registra la cuenta que será la primera administradora. En SQL Editor, asígnale el rol:

   ```sql
   update public.profiles
   set role = 'administracion', approved = true
   where username = 'tu_usuario';
   ```

4. Las cuentas nuevas comienzan como pasajeros. Deben completar KYC para solicitar viajes o postularse como conductores. En **Usuarios**, administración puede asignar roles internos, categoría de vehículo y porcentaje de ganancia. Las cuentas y solicitudes comerciales heredadas quedan archivadas.
5. Revisa **Authentication → URL Configuration** y agrega la URL publicada en GitHub Pages a las URLs permitidas.

La URL del proyecto y la clave `anon`/publishable del cliente están en `app.js`. La seguridad depende de RLS y las funciones SQL; nunca añadas la clave `service_role` al frontend ni al repositorio.

## Viajes, tarifas y mapas

- Los mapas y teselas usan OpenStreetMap, la búsqueda de lugares Nominatim y las rutas OSRM públicas. Son servicios comunitarios con límites y disponibilidad no garantizada. Sin una ruta vehicular OSRM válida no se envía la solicitud; los puntos también se pueden colocar manualmente.
- Tarifas en USD por kilómetro: carro Express **0,90**, carro Económica **0,80**, moto Express **0,40**, moto Económica **0,35**. El servidor recalcula la tarifa desde la distancia y rechaza precios que no coincidan. Soporte revisa y libera el viaje; puede asignarlo directamente a un conductor compatible.
- El mapa del conductor muestra zonas de demanda de las últimas 24 horas, recogidas de viajes disponibles para su categoría y la ganancia estimada. El conductor puede seguir la ruta dentro de EnRuta2 o abrir la navegación al siguiente punto en Google Maps.
- El mapa del pasajero muestra ubicaciones aproximadas de conductores disponibles. Una vez asignado el viaje, el pasajero ve la posición GPS precisa del conductor y la ruta; el enlace compartido con un familiar es revocable, caduca al finalizar el viaje o después de 24 horas y no incluye nombre ni teléfono.
- Las posiciones aproximadas se redondean en el servidor. La ubicación precisa se limita al viaje asignado y a personal autorizado; se ocultan posiciones de más de 90 segundos. El conductor deja de compartir al desconectarse o cerrar sesión.
- KYC es una revisión manual; no hay comparación biométrica, prueba de vida ni OTP telefónico. Fotos de identidad y documentos de aspirantes se guardan en los buckets privados `customer-kyc` y `applicant-documents`. Administración revisa verificaciones y postulaciones en sus secciones correspondientes. Limita el acceso administrativo y revisa las obligaciones locales de privacidad y retención.
- Despliega `admin-delete-user` con `supabase functions deploy admin-delete-user` para que eliminar una cuenta también quite sus documentos privados.

## Notificaciones en Android

Las alertas de sonido de viaje funcionan mientras la app está abierta. Para push cuando Android la pone en segundo plano, configura Firebase Cloud Messaging con el ID nuevo **`com.enruta2.app`** (la configuración anterior de Firebase para `delivery.aunpaso.app` no sirve para este identificador). Guarda `google-services.json` como el secreto de Actions `GOOGLE_SERVICES_JSON_BASE64`; el workflow lo genera localmente durante la compilación y el archivo se ignora en Git.

Para envío remoto también hace falta desplegar `send-courier-push`, configurar `FCM_SERVICE_ACCOUNT_JSON` y `PUSH_WEBHOOK_SECRET` en Supabase, y crear un webhook `INSERT` sobre `public.courier_push_outbox`. Nunca copies claves privadas de Firebase ni la `service_role` de Supabase al frontend o al repositorio. Los usuarios deben activar las alertas y permitir notificaciones. Android puede restringirlas si se fuerza la detención, se revocan permisos o se limita la batería. La PWA web no se registra para FCM.

## Publicar en GitHub Pages

El workflow `.github/workflows/deploy.yml` publica la raíz del repositorio al hacer push a `main`. En GitHub, abre **Settings → Pages** y selecciona **GitHub Actions** como origen. El workflow marca el service worker con una versión única. Si publicas manualmente, cambia `BUILD_VERSION` en `sw.js` en cada publicación. Los archivos fuente están en la raíz; `www/` es una copia generada por `npm run android:sync`.

Para probar la PWA localmente en Windows, ejecuta `python -m http.server 8000` desde la carpeta del proyecto y abre `http://localhost:8000`. No abras `index.html` directamente como `file://`: el service worker no funcionará. La compilación/sincronización Android usa:

```powershell
npm ci
npm run android:sync
npm run android:build-debug
```

`android:sync` copia la PWA actual y los assets a `www/` antes de sincronizar Capacitor. Para APK local se requiere Android SDK/Gradle; la primera compilación puede necesitar descargar dependencias. Firebase push requiere registrar una aplicación Android con el nuevo ID `com.enruta2.app` y configurar el secreto descrito arriba.

## Funcionalidades

- Registro e inicio de sesión por usuario, roles, permisos de soporte/administración y verificación KYC.
- Solicitudes de traslado en carro o moto, selección de categoría y modalidad, cálculo de ruta OSRM y precios verificados también en el servidor.
- Disponibilidad de conductores con ubicación en vivo. En el mapa del conductor se ven demanda agregada, viajes disponibles para su categoría, recogida y ganancia estimada.
- Asignación/liberación de viajes en tiempo real, aceptación del conductor y ruta marcada en el mapa. El conductor puede cambiar a Google Maps para navegación.
- Mapa del pasajero con conductores disponibles aproximados; durante el viaje muestra el conductor asignado y permite compartir un enlace privado, revocable y temporal con un familiar.
- Historial y estado del viaje para pasajero, conductor y personal autorizado. Las alertas avisan de viajes nuevos o asignados; no existe una alarma de demora a los 10 minutos.
- Interfaz adaptable, PWA instalable, actualizaciones de service worker y app Android mediante Capacitor.

Los cambios de viaje y disponibilidad usan Supabase Realtime con actualización periódica de respaldo mientras la sesión está abierta. La app solicita permisos de ubicación cuando corresponda y envía la posición mientras el conductor está disponible; los navegadores pueden suspender el seguimiento en segundo plano. Android permite seguimiento en segundo plano con el servicio nativo, sujeto a los permisos y restricciones de batería del dispositivo.

Al desplegar, el service worker se actualiza con una versión única y reemplaza la caché anterior. La app necesita conexión a internet para Supabase, mapas y servicios de geocodificación. La protección de datos debe aplicarse en Supabase mediante Auth, RLS y validación del servidor; ocultar código en el navegador no es un control de seguridad.
