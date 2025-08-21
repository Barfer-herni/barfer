# Esquema de la Base de Datos MongoDB - Barfer

Este documento detalla la estructura de las colecciones utilizadas en la base de datos de MongoDB del proyecto. La información ha sido generada a partir de documentos reales de la base de datos para asegurar su precisión.

---

## 1. `addresses`

Almacena las direcciones de los usuarios.

- `_id` (ObjectID): Identificador único de la dirección.
- `userId` (ObjectID): Referencia al usuario al que pertenece la dirección.
- `address` (String): La calle y número.
- `firstName` (String): Nombre del destinatario.
- `lastName` (String): Apellido del destinatario.
- `zipCode` (String): Código postal.
- `phone` (String): Número de teléfono de contacto.
- `email` (String): Email de contacto.
- `floorNumber` (String): Número de piso.
- `departmentNumber` (String): Número de departamento.
- `betweenStreets` (String): Calles de referencia.
- `city` (String): Ciudad.
- `createdAt` (Date): Fecha de creación.
- `updatedAt` (Date): Fecha de última actualización.
- `__v` (Number): Versión del documento (Mongoose).

---

## 2. `bankinfos`

Contiene la información bancaria del negocio para los pagos.

- `_id` (ObjectID): Identificador único.
- `cvu` (String): Clave Virtual Uniforme (CVU).
- `alias` (String): Alias de la cuenta.
- `cuit` (String): CUIT del titular de la cuenta.
- `businessName` (String): Razón social del titular.
- `createdAt` (Date): Fecha de creación.
- `updatedAt` (Date): Fecha de última actualización.
- `__v` (Number): Versión del documento (Mongoose).

---

## 3. `categories`

Define las categorías de los productos.

- `_id` (ObjectID): Identificador único de la categoría.
- `name` (String): Nombre de la categoría (e.g., "Perros").
- `description` (String): Descripción de la categoría.
- `discountAmount` (Number): Monto de descuento aplicable.
- `discountPerAdditionalProduct` (Number): Descuento por producto adicional.
- `discountThreshold` (Number): Cantidad de productos para activar el descuento.

---

## 4. `coupons`

Almacena los cupones de descuento.

- `_id` (ObjectID): Identificador único del cupón.
- `code` (String): Código que el usuario introduce.
- `count` (Number): Veces que el cupón ha sido usado.
- `limit` (Number): Límite máximo de usos.
- `description` (String): Descripción del cupón.
- `type` (String): Tipo de descuento (e.g., "percentage").
- `value` (Number): El valor del descuento.
- `applicableProductOption` (ObjectID | null): A qué opción de producto aplica (si aplica).
- `maxAplicableUnits` (Number): Unidades máximas a las que aplica el descuento.
- `usedByUsers` (Object): Registro de usuarios que han usado el cupón.
- `createdAt` (Date): Fecha de creación.
- `updatedAt` (Date): Fecha de última actualización.
- `__v` (Number): Versión del documento (Mongoose).

---

## 5. `deliveryareas`

Define las zonas geográficas de reparto.

- `_id` (ObjectID): Identificador único del área.
- `description` (String): Nombre del área (e.g., "CABA L2").
- `coordinates` (Array): Coordenadas GeoJSON que definen el polígono del área.
- `schedule` (String): Horario de reparto para esta zona.
- `orderCutOffHour` (Number): Hora límite para realizar pedidos.
- `enabled` (Boolean): Si la zona está activa.
- `sameDayDelivery` (Boolean): Si ofrece entrega en el mismo día.
- `sameDayDeliveryDays` (Array): Días en que aplica la entrega en el mismo día.
- `whatsappNumber` (String): Número de WhatsApp de contacto para la zona.
- `sheetName` (String): Nombre de la hoja de cálculo asociada (si aplica).
- `createdAt` (Date): Fecha de creación.
- `updatedAt` (Date): Fecha de última actualización.
- `__v` (Number): Versión del documento (Mongoose).

---

## 6. `discounts`

Define descuentos específicos aplicables a productos.

- `_id` (ObjectID): Identificador único del descuento.
- `name` (String): Nombre del descuento.
- `description` (String): Descripción detallada de cómo funciona.
- `applicableOptionIds` (Array de ObjectID): IDs de las opciones de producto a las que aplica.
- `initialQuantity` (Number): Cantidad necesaria para el descuento inicial.
- `initialDiscountAmount` (Number): Monto del descuento inicial.
- `additionalDiscountAmount` (Number): Descuento por cada unidad adicional.
- `isActive` (Boolean): Si el descuento está activo.
- `createdAt` (Date): Fecha de creación.
- `updatedAt` (Date): Fecha de última actualización.
- `__v` (Number): Versión del documento (Mongoose).

---

## 7. `events`

Almacena eventos o anuncios para mostrar en la web.

- `_id` (ObjectID): Identificador único del evento.
- `title` (String): Título del evento.
- `isActive` (Boolean): Si el evento está activo.
- `createdAt` (Date): Fecha de creación.
- `updatedAt` (Date): Fecha de última actualización.
- `__v` (Number): Versión del documento (Mongoose).

---

## 8. `options`

Define las variantes de un producto (e.g., tamaño, peso).

- `_id` (ObjectID): Identificador único de la opción.
- `name` (String): Nombre de la variante (e.g., "10KG").
- `description` (String): Descripción de la variante.
- `stock` (Number): Cantidad de stock disponible.
- `price` (Number): Precio de esta variante.
- `productId` (ObjectID): Referencia al producto padre.
- `createdAt` (Date): Fecha de creación.
- `updatedAt` (Date): Fecha de última actualización.
- `__v` (Number): Versión del documento (Mongoose).

---

## 9. `orders`

Colección central que almacena toda la información de un pedido.

- `_id` (ObjectID): Identificador único del pedido.
- `status` (String): Estado del pedido (e.g., "pending", "confirmed").
- `total` (Number): Precio final del pedido.
- `subTotal` (Number): Precio antes de envío y descuentos.
- `shippingPrice` (Number): Costo de envío.
- `notes` (String): Notas del cliente.
- `paymentMethod` (String): Método de pago.
- `coupon` (Object | null): Cupón aplicado.
- `createdAt` (Date): Fecha de creación.
- `updatedAt` (Date): Fecha de última actualización.
- `__v` (Number): Versión del documento (Mongoose).
- `user` (Object): Datos del usuario que realiza el pedido.
- `address` (Object): Dirección de envío.
- `deliveryArea` (Object): Zona de entrega seleccionada.
- `items` (Array de Objetos): Lista de productos del pedido.
    - `id` (ObjectID): ID del producto.
    - `name` (String): Nombre del producto.
    - `description` (String): Descripción.
    - `images` (Array de String): URLs de las imágenes.
    - `options` (Array de Objetos): Variantes seleccionadas.
    - `price` (Number): Precio total de la línea de producto.
    - `discountApllied` (Number): Descuento aplicado a la línea.

---

## 10. `products`

Contiene la información de los productos disponibles.

- `_id` (ObjectID): Identificador único del producto.
- `name` (String): Nombre del producto.
- `description` (String): Descripción detallada.
- `images` (Array de String): URLs de las imágenes del producto.
- `category` (Object): Categoría a la que pertenece el producto.
- `options` (Array de Objetos): Variantes disponibles del producto.
- `salesCount` (Number): Contador de ventas.
- `sameDayDelivery` (Boolean): Si aplica para entrega en el mismo día.
- `createdAt` (Date): Fecha de creación.
- `updatedAt` (Date): Fecha de última actualización.
- `__v` (Number): Versión del documento (Mongoose).

---

## 11. `salespoints`

Almacena los puntos de venta físicos.

- `_id` (ObjectID): Identificador único del punto de venta.
- `name` (String): Nombre del local.
- `address` (String): Dirección.
- `contact` (String): Información de contacto.
- `ig` (String): Perfil de Instagram.
- `region` (String): Zona o región (e.g., "CABA").
- `hours` (String): Horario de atención.
- `latitude` (Number): Coordenada de latitud.
- `longitude` (Number): Coordenada de longitud.

---

## 12. `users`

Almacena la información de los usuarios registrados.

- `_id` (ObjectID): Identificador único del usuario.
- `email` (String): Email del usuario (único).
- `password` (String): Contraseña hasheada.
- `name` (String): Nombre del usuario.
- `role` (Number): Rol del usuario (e.g., 3 para admin/cliente).
- `resetPasswordToken` (String | null): Token para reseteo de contraseña.
- `createdAt` (Date): Fecha de creación.
- `updatedAt` (Date): Fecha de última actualización.
- `__v` (Number): Versión del documento (Mongoose).

---

## 13. `repartos`

Almacena la información de control de repartos semanales. Cada semana es un documento separado para mejor escalabilidad.

- `_id` (ObjectID): Identificador único del documento (generado automáticamente por MongoDB).
- `weekKey` (String): Clave única de la semana (formato: "YYYY-MM-DD").
- `data` (Object): Datos de repartos para la semana.
    - `1` (Array): Entradas para lunes (3 filas).
        - `id` (String): Identificador único de la entrada.
        - `text` (String): Texto de la entrada.
        - `isCompleted` (Boolean): Si la tarea está completada.
        - `createdAt` (Date): Fecha de creación.
        - `updatedAt` (Date): Fecha de última actualización.
    - `2` (Array): Entradas para martes (3 filas).
    - `3` (Array): Entradas para miércoles (3 filas).
    - `4` (Array): Entradas para jueves (3 filas).
    - `5` (Array): Entradas para viernes (3 filas).
    - `6` (Array): Entradas para sábado (3 filas).
- `createdAt` (Date): Fecha de creación del documento.
- `updatedAt` (Date): Fecha de última actualización del documento.
- `__v` (Number): Versión del documento (Mongoose).

**Nota**: 
- Cada día tiene exactamente 3 filas de entradas
- Cada semana se identifica por la fecha del lunes en formato "YYYY-MM-DD"
- Cada semana es un documento separado para mejor rendimiento y escalabilidad
- Se puede crear un índice en `weekKey` para búsquedas rápidas

--- 