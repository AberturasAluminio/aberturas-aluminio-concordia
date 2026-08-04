# Tienda Virtual - Aberturas Aluminio Concordia

Proyecto independiente de la aplicación interna de ventas.

## Vista previa local

Iniciar desde la carpeta principal:

```powershell
python -m http.server 8090 --directory tienda-virtual
```

Abrir:

- Tienda: `http://localhost:8090`
- Administración: `http://localhost:8090/admin.html`

## Panel administrador

El panel permite:

- Crear y editar productos.
- Cargar una imagen o usar una URL.
- Publicar u ocultar productos.
- Elegir múltiples medidas, manos y colores.
- Actualizar precios por porcentaje general.
- Actualizar precios por categoría.
- Importar y exportar productos en Excel.
- Configurar el número de WhatsApp.

Cada medida se carga con su propio precio. En puertas, la mano se configura como una elección independiente:

```text
Puerta Aluminio 36 mm Ciega
70x200: $335.000
80x200: $365.000
90x200: $405.000
Mano: Derecha / Izquierda
```

## Excel

Columnas recomendadas:

```text
Código | Categoría | Nombre | Detalle | Medida | Mano | Color | Precio | Imagen
```

Se utiliza una fila por medida y precio. Para varias medidas del mismo producto se repite el código:

```text
PAL-36-C | Puertas de aluminio | Puerta Aluminio 36 mm Ciega | ... | 70x200 | Derecha / Izquierda | Blanco | 335000
PAL-36-C | Puertas de aluminio | Puerta Aluminio 36 mm Ciega | ... | 80x200 | Derecha / Izquierda | Blanco | 365000
PAL-36-C | Puertas de aluminio | Puerta Aluminio 36 mm Ciega | ... | 90x200 | Derecha / Izquierda | Blanco | 405000
```

También se admite una columna combinada llamada `Mano / Color`.

Reglas de importación:

- Si el código existe, el producto se actualiza.
- Si el código no existe, se crea.
- Los productos ausentes en el archivo se conservan.
- Siempre se muestra una vista previa.
- No se aplican cambios hasta pulsar `Confirmar y guardar cambios`.
- Si hay filas con errores, la confirmación queda bloqueada.

## Estado de esta versión

La tienda funciona como catálogo con carrito y cierre de compra por WhatsApp. Los datos se guardan en el almacenamiento local del navegador.

Esto sirve para configurar, probar y presentar la tienda en esta computadora. Antes de administrarla desde distintos equipos o publicar cambios para todos los visitantes, se necesita conectar el panel a una base de datos y agregar acceso protegido.

## Dominio

Dominio reservado:

```text
aberturasaluminioconcordia.com.ar
```
