# Picasso UI

Abrir `/design-system` con `npm run dev` para ver la paleta, tipografía y los diez componentes. La página está disponible en español, inglés y portugués. Sus interacciones solo modifican el estado local de los ejemplos.

## Estilos

Los tokens `--ui-*` de `src/index.css` definen acento, superficies, texto, bordes, error y radio. Las clases `ui-*` centralizan los estilos de los diez componentes. Tailwind define las familias tipográficas: Inter/system-ui para texto y Georgia para títulos. Las clases de layout (márgenes, grid, ancho) pueden pasarse desde cada pantalla.

La papelera usa SVG de 24 unidades, trazo de 2 y `currentColor`. Para nuevos iconos, mantener estos atributos; ocultar el SVG a tecnologías de asistencia cuando el botón ya tenga una etiqueta accesible.

## Componentes y uso real

| Componente   | Archivo                                  | Uso                                           |
| ------------ | ---------------------------------------- | --------------------------------------------- |
| Button       | `src/components/ui/controls.tsx`         | Pedidos, pago y empleados                     |
| Input        | `src/components/ui/controls.tsx`         | Búsqueda, datos de contacto, pago y empleados |
| Select       | `src/components/ui/controls.tsx`         | Método bancario y roles de empleados          |
| Metric       | `src/features/employee-panel/shared.tsx` | Resumen del panel                             |
| Panel        | `src/features/employee-panel/shared.tsx` | Secciones de gestión                          |
| TabButton    | `src/features/employee-panel/shared.tsx` | Navegación del panel                          |
| Field        | `src/features/employee-panel/shared.tsx` | Etiquetas de formularios                      |
| Checkbox     | `src/features/employee-panel/shared.tsx` | Opciones del menú                             |
| StatusPill   | `src/features/employee-panel/shared.tsx` | Indicadores de estado                         |
| DeleteButton | `src/features/employee-panel/shared.tsx` | Borrado de registros                          |

## Contratos y accesibilidad

- `Button` admite `variant="primary|secondary|danger"`, `loading` y los atributos nativos. Por defecto usa `type="button"`; para enviar un formulario se requiere `type="submit"`. Durante carga se deshabilita y expone `aria-busy`.
- `Input` y `Select` conservan atributos, eventos y refs nativos. `invalid` establece `aria-invalid`; el mensaje debe enlazarse mediante `aria-describedby`.
- Usar una etiqueta visible (`Field` o `label`) para cada control. Un placeholder no sustituye la etiqueta.
- Los estados de foco usan un contorno visible. Los controles deshabilitados conservan la semántica HTML y los botones tienen un tamaño mínimo de 44 px.
- `TabButton` funciona como botón de selección con `aria-pressed`; no representa por sí solo el patrón ARIA completo de tabs.
- `DeleteButton` exige una etiqueta que identifique el registro. El icono es decorativo.
- La página de ejemplos incluye carga, error, deshabilitado y controles interactivos. Comprobar también el recorrido con Tab y el comportamiento en móvil.

## Ejemplo

```tsx
<Field label="Nombre">
  <Input required value={name} onChange={(event) => setName(event.target.value)} />
</Field>
<Button type="submit" loading={saving}>Guardar</Button>
```

No hace falta sustituir todos los elementos HTML del proyecto de una vez. Usar estos componentes en formularios nuevos y migrar los existentes cuando se modifiquen. El contrato de componentes y la documentación están preparados; una evaluación de accesibilidad completa y la revisión visual de todas las pantallas son comprobaciones adicionales.
