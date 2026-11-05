# Privacidad y términos

Rama: `feature/privacy-terms`, creada desde `feature/frontend-backend-integration`.

## Implementación

- `/privacidad` y `/terminos`, con alias `/privacy` y `/terms` y soporte de barra final.
- Textos completos en español, inglés y portugués, seleccionados con el idioma global.
- Enlaces en el pie de página, índice de secciones y enlace entre ambos documentos.
- Título del documento y foco en el encabezado al abrir cada página; navegación atrás/adelante compatible con la aplicación.
- Acceso público independiente de los servicios del backend.

## Contenido verificado

Se revisaron los pedidos conectados, datos de empleados y chat, logs de Nginx, preferencia local de idioma y pedidos de demostración en localStorage. El formulario público de contacto y el chat público son demostraciones; no se presentan como vías de solicitud reales. El flujo no solicita datos de tarjeta.

El usuario confirmó que todavía no hay un email público del proyecto. El texto dirige las consultas al equipo mediante la persona o canal que facilita el acceso. No se inventaron un responsable mercantil, domicilio, correo, jurisdicción o plazo automático de borrado.

Los textos corresponden a un proyecto académico. Antes de utilizarlo como servicio comercial, el equipo debe completar y verificar la identidad y contacto del responsable, el alojamiento/destinatarios, las condiciones aplicables al tratamiento de datos reales y los criterios concretos de conservación. Las páginas deben actualizarse cuando se integren autenticación u otros tratamientos que cambien lo descrito.

## Fuentes editoriales

Se consultaron los criterios de información transparente de la [Comisión Europea](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/obligations_en) y de la [Data Protection Commission](https://www.dataprotection.ie/en/individuals/know-your-rights/right-be-informed-transparency-article-13-14-gdpr) para organizar finalidades, acceso, conservación y contacto. Esta consulta no determina por sí sola qué normativa es aplicable a una futura explotación comercial.

## Comprobaciones

Compilación del frontend y 95 pruebas pasando (12 nuevas). Se comprueban acceso directo sin backend, rutas y alias, enlaces del pie, enlace entre documentos, historial, títulos, foco y cambio de idioma.

La revisión visual en navegador queda pendiente porque el entorno de control de navegador falló al iniciarse.
