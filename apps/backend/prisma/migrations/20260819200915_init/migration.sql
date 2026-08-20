-- CreateEnum
CREATE TYPE "EstadosSolicitud" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "system_settings" (
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "RolesUsuario" (
    "RolID" SERIAL NOT NULL,
    "NombreRol" VARCHAR(255) NOT NULL,
    "Descripcion" TEXT,

    CONSTRAINT "RolesUsuario_pkey" PRIMARY KEY ("RolID")
);

-- CreateTable
CREATE TABLE "Idiomas" (
    "IdiomaID" SERIAL NOT NULL,
    "CodigoIdioma" VARCHAR(10) NOT NULL,
    "Idioma" VARCHAR(255) NOT NULL,

    CONSTRAINT "Idiomas_pkey" PRIMARY KEY ("IdiomaID")
);

-- CreateTable
CREATE TABLE "Usuarios" (
    "UsuarioID" SERIAL NOT NULL,
    "Email" VARCHAR(255) NOT NULL,
    "PasswordHash" VARCHAR(255),
    "ProveedorOAuth" VARCHAR(50),
    "OAuthID" VARCHAR(255),
    "FotoPerfil" VARCHAR(255),
    "RolID" INTEGER NOT NULL,
    "IdiomaID" INTEGER NOT NULL,
    "Activo" BOOLEAN NOT NULL DEFAULT true,
    "EmailVereficado" BOOLEAN NOT NULL DEFAULT false,
    "UlitmoAcceso" TIMESTAMP,
    "FechaCreacion" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuarios_pkey" PRIMARY KEY ("UsuarioID")
);

-- CreateTable
CREATE TABLE "Direcciones" (
    "DireccionID" SERIAL NOT NULL,
    "ClienteID" INTEGER NOT NULL,
    "Calle" VARCHAR(255) NOT NULL,
    "Numero" VARCHAR(10) NOT NULL,
    "Puerta" VARCHAR(10),
    "Piso" VARCHAR(10),
    "Localidad" VARCHAR(255) NOT NULL,

    CONSTRAINT "Direcciones_pkey" PRIMARY KEY ("DireccionID")
);

-- CreateTable
CREATE TABLE "Clientes" (
    "ClienteID" SERIAL NOT NULL,
    "UsuarioID" INTEGER NOT NULL,
    "Nombre" VARCHAR(255) NOT NULL,
    "Apellido" VARCHAR(255) NOT NULL,
    "Telefono" VARCHAR(255),
    "FechaNacimiento" DATE NOT NULL,
    "FechaPrimerPedido" TIMESTAMP,

    CONSTRAINT "Clientes_pkey" PRIMARY KEY ("ClienteID")
);

-- CreateTable
CREATE TABLE "DireccionesRestaurante" (
    "DireccionID" SERIAL NOT NULL,
    "Calle" VARCHAR(255) NOT NULL,
    "Numero" VARCHAR(10) NOT NULL,
    "Puerta" VARCHAR(10),
    "Piso" VARCHAR(10),
    "Localidad" VARCHAR(255) NOT NULL,
    "CodigoPostal" VARCHAR(10),

    CONSTRAINT "DireccionesRestaurante_pkey" PRIMARY KEY ("DireccionID")
);

-- CreateTable
CREATE TABLE "Restaurantes" (
    "RestauranteID" SERIAL NOT NULL,
    "Nombre" VARCHAR(255) NOT NULL,
    "DireccionID" INTEGER NOT NULL,
    "Activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Restaurantes_pkey" PRIMARY KEY ("RestauranteID")
);

-- CreateTable
CREATE TABLE "CargosEmpleado" (
    "CargoEmpleadoID" SERIAL NOT NULL,
    "NombreCargo" VARCHAR(255) NOT NULL,
    "Descripcion" TEXT,

    CONSTRAINT "CargosEmpleado_pkey" PRIMARY KEY ("CargoEmpleadoID")
);

-- CreateTable
CREATE TABLE "Empleados" (
    "EmpleadoID" SERIAL NOT NULL,
    "UsuarioID" INTEGER NOT NULL,
    "Nombre" VARCHAR(255) NOT NULL,
    "Apellido" VARCHAR(255) NOT NULL,
    "Telefono" VARCHAR(255),
    "RestuaranteID" INTEGER NOT NULL,
    "CargoEmpleadoID" INTEGER NOT NULL,
    "FechaNacimiento" DATE NOT NULL,
    "FechaIngreso" TIMESTAMP NOT NULL,
    "FechaDespido" TIMESTAMP,
    "Activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Empleados_pkey" PRIMARY KEY ("EmpleadoID")
);

-- CreateTable
CREATE TABLE "CategoriasMenus" (
    "CategoriaID" SERIAL NOT NULL,
    "Nombre" VARCHAR(255) NOT NULL,
    "Descripcion" TEXT,

    CONSTRAINT "CategoriasMenus_pkey" PRIMARY KEY ("CategoriaID")
);

-- CreateTable
CREATE TABLE "ItemsMenu" (
    "ItemID" SERIAL NOT NULL,
    "Nombre" VARCHAR(255) NOT NULL,
    "Imagen" TEXT,
    "Descripcion" TEXT,
    "Precio" DECIMAL(10,2) NOT NULL,
    "CategoriaID" INTEGER NOT NULL,
    "Disponible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ItemsMenu_pkey" PRIMARY KEY ("ItemID")
);

-- CreateTable
CREATE TABLE "UnidadesMedida" (
    "UnidadID" SERIAL NOT NULL,
    "Abreviatura" VARCHAR(10) NOT NULL,
    "Nombre" VARCHAR(255) NOT NULL,

    CONSTRAINT "UnidadesMedida_pkey" PRIMARY KEY ("UnidadID")
);

-- CreateTable
CREATE TABLE "Insumos" (
    "InsumosID" SERIAL NOT NULL,
    "Nombre" VARCHAR(255) NOT NULL,
    "UnidadID" INTEGER NOT NULL,
    "CostoUnidad" DECIMAL(10,2) NOT NULL,
    "StockActual" DECIMAL(10,3) NOT NULL DEFAULT 0,

    CONSTRAINT "Insumos_pkey" PRIMARY KEY ("InsumosID")
);

-- CreateTable
CREATE TABLE "Recetas" (
    "RecetaID" SERIAL NOT NULL,
    "ItemID" INTEGER NOT NULL,
    "InsumosID" INTEGER NOT NULL,
    "Cantidad" DECIMAL(10,3) NOT NULL,

    CONSTRAINT "Recetas_pkey" PRIMARY KEY ("RecetaID")
);

-- CreateTable
CREATE TABLE "EstadosPedido" (
    "EstadoID" SERIAL NOT NULL,
    "Nombre" VARCHAR(50) NOT NULL,

    CONSTRAINT "EstadosPedido_pkey" PRIMARY KEY ("EstadoID")
);

-- CreateTable
CREATE TABLE "Mesas" (
    "MesaID" SERIAL NOT NULL,
    "Numero" VARCHAR(10) NOT NULL,
    "Capacidad" INTEGER NOT NULL,

    CONSTRAINT "Mesas_pkey" PRIMARY KEY ("MesaID")
);

-- CreateTable
CREATE TABLE "Pedidos" (
    "PedidoID" SERIAL NOT NULL,
    "MesaID" INTEGER,
    "ClienteID" INTEGER NOT NULL,
    "RestauranteID" INTEGER NOT NULL,
    "EmpleadoID" INTEGER NOT NULL,
    "EstadoID" INTEGER NOT NULL,
    "FechaHora" TIMESTAMP NOT NULL,
    "Total" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "Pedidos_pkey" PRIMARY KEY ("PedidoID")
);

-- CreateTable
CREATE TABLE "DetallePedidos" (
    "DetallePedidoID" SERIAL NOT NULL,
    "PedidoID" INTEGER NOT NULL,
    "ItemID" INTEGER NOT NULL,
    "Cantidad" INTEGER NOT NULL DEFAULT 1,
    "PrecioUnitario" DECIMAL(10,2) NOT NULL,
    "Notas" TEXT,

    CONSTRAINT "DetallePedidos_pkey" PRIMARY KEY ("DetallePedidoID")
);

-- CreateTable
CREATE TABLE "HistorialEstadoPedido" (
    "HistorialID" SERIAL NOT NULL,
    "PedidoID" INTEGER NOT NULL,
    "EstadoID" INTEGER NOT NULL,
    "FechaHora" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistorialEstadoPedido_pkey" PRIMARY KEY ("HistorialID")
);

-- CreateTable
CREATE TABLE "MetodosPago" (
    "MetodoID" SERIAL NOT NULL,
    "Nombre" VARCHAR(50) NOT NULL,

    CONSTRAINT "MetodosPago_pkey" PRIMARY KEY ("MetodoID")
);

-- CreateTable
CREATE TABLE "Pagos" (
    "PagoID" SERIAL NOT NULL,
    "PedidoID" INTEGER NOT NULL,
    "MetodoID" INTEGER NOT NULL,
    "Monto" DECIMAL(10,2) NOT NULL,
    "FechaHora" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pagos_pkey" PRIMARY KEY ("PagoID")
);

-- CreateTable
CREATE TABLE "Facturas" (
    "FacturaID" SERIAL NOT NULL,
    "PedidoId" INTEGER NOT NULL,
    "NumeroFactura" VARCHAR(50) NOT NULL,
    "FechaEmision" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ClienteDocumento" VARCHAR(50),
    "ClienteNombre" VARCHAR(255),
    "ClienteDireccion" TEXT,
    "BaseImponible" DECIMAL(10,2) NOT NULL,
    "PorcentajeIVA" DECIMAL(10,2) NOT NULL,
    "MontoIVA" DECIMAL(10,2) NOT NULL,
    "TotalFactura" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "Facturas_pkey" PRIMARY KEY ("FacturaID")
);

-- CreateTable
CREATE TABLE "Amigos" (
    "AmistadID" SERIAL NOT NULL,
    "UsuarioSolicitudID" INTEGER NOT NULL,
    "UsuarioReceptorID" INTEGER NOT NULL,
    "Estado" "EstadosSolicitud" NOT NULL DEFAULT 'pending',
    "FechaCreacion" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Amigos_pkey" PRIMARY KEY ("AmistadID")
);

-- CreateTable
CREATE TABLE "MensajeChat" (
    "MensajeID" SERIAL NOT NULL,
    "RemintenteID" INTEGER NOT NULL,
    "ReceptorID" INTEGER NOT NULL,
    "PedidoID" INTEGER,
    "Mensaje" TEXT NOT NULL,
    "FechaHora" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Leido" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MensajeChat_pkey" PRIMARY KEY ("MensajeID")
);

-- CreateTable
CREATE TABLE "Notificaciones" (
    "NotificacionID" SERIAL NOT NULL,
    "UsuarioID" INTEGER NOT NULL,
    "TipoAccion" VARCHAR(50),
    "Mensaje" TEXT NOT NULL,
    "Leido" BOOLEAN NOT NULL DEFAULT false,
    "FechaHora" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificaciones_pkey" PRIMARY KEY ("NotificacionID")
);

-- CreateTable
CREATE TABLE "ResenasRestaurante" (
    "ResenaID" SERIAL NOT NULL,
    "ClienteID" INTEGER NOT NULL,
    "RestauranteID" INTEGER NOT NULL,
    "Calificacion" SMALLINT NOT NULL,
    "Comentario" TEXT,
    "FechaHora" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResenasRestaurante_pkey" PRIMARY KEY ("ResenaID")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuarios_Email_key" ON "Usuarios"("Email");

-- CreateIndex
CREATE UNIQUE INDEX "Clientes_UsuarioID_key" ON "Clientes"("UsuarioID");

-- CreateIndex
CREATE UNIQUE INDEX "Restaurantes_DireccionID_key" ON "Restaurantes"("DireccionID");

-- CreateIndex
CREATE UNIQUE INDEX "Empleados_UsuarioID_key" ON "Empleados"("UsuarioID");

-- CreateIndex
CREATE INDEX "ItemsMenu_CategoriaID_idx" ON "ItemsMenu"("CategoriaID");

-- CreateIndex
CREATE INDEX "Recetas_ItemID_idx" ON "Recetas"("ItemID");

-- CreateIndex
CREATE INDEX "DetallePedidos_PedidoID_ItemID_idx" ON "DetallePedidos"("PedidoID", "ItemID");

-- CreateIndex
CREATE INDEX "HistorialEstadoPedido_PedidoID_idx" ON "HistorialEstadoPedido"("PedidoID");

-- CreateIndex
CREATE UNIQUE INDEX "Facturas_PedidoId_key" ON "Facturas"("PedidoId");

-- CreateIndex
CREATE UNIQUE INDEX "Facturas_NumeroFactura_key" ON "Facturas"("NumeroFactura");

-- CreateIndex
CREATE UNIQUE INDEX "Amigos_UsuarioSolicitudID_UsuarioReceptorID_key" ON "Amigos"("UsuarioSolicitudID", "UsuarioReceptorID");

-- CreateIndex
CREATE INDEX "MensajeChat_PedidoID_idx" ON "MensajeChat"("PedidoID");

-- CreateIndex
CREATE INDEX "Notificaciones_UsuarioID_idx" ON "Notificaciones"("UsuarioID");

-- CreateIndex
CREATE UNIQUE INDEX "ResenasRestaurante_ClienteID_RestauranteID_key" ON "ResenasRestaurante"("ClienteID", "RestauranteID");

-- AddForeignKey
ALTER TABLE "Usuarios" ADD CONSTRAINT "Usuarios_RolID_fkey" FOREIGN KEY ("RolID") REFERENCES "RolesUsuario"("RolID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuarios" ADD CONSTRAINT "Usuarios_IdiomaID_fkey" FOREIGN KEY ("IdiomaID") REFERENCES "Idiomas"("IdiomaID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Direcciones" ADD CONSTRAINT "Direcciones_ClienteID_fkey" FOREIGN KEY ("ClienteID") REFERENCES "Clientes"("ClienteID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clientes" ADD CONSTRAINT "Clientes_UsuarioID_fkey" FOREIGN KEY ("UsuarioID") REFERENCES "Usuarios"("UsuarioID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Restaurantes" ADD CONSTRAINT "Restaurantes_DireccionID_fkey" FOREIGN KEY ("DireccionID") REFERENCES "DireccionesRestaurante"("DireccionID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Empleados" ADD CONSTRAINT "Empleados_UsuarioID_fkey" FOREIGN KEY ("UsuarioID") REFERENCES "Usuarios"("UsuarioID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Empleados" ADD CONSTRAINT "Empleados_CargoEmpleadoID_fkey" FOREIGN KEY ("CargoEmpleadoID") REFERENCES "CargosEmpleado"("CargoEmpleadoID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Empleados" ADD CONSTRAINT "Empleados_RestuaranteID_fkey" FOREIGN KEY ("RestuaranteID") REFERENCES "Restaurantes"("RestauranteID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemsMenu" ADD CONSTRAINT "ItemsMenu_CategoriaID_fkey" FOREIGN KEY ("CategoriaID") REFERENCES "CategoriasMenus"("CategoriaID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insumos" ADD CONSTRAINT "Insumos_UnidadID_fkey" FOREIGN KEY ("UnidadID") REFERENCES "UnidadesMedida"("UnidadID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recetas" ADD CONSTRAINT "Recetas_ItemID_fkey" FOREIGN KEY ("ItemID") REFERENCES "ItemsMenu"("ItemID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recetas" ADD CONSTRAINT "Recetas_InsumosID_fkey" FOREIGN KEY ("InsumosID") REFERENCES "Insumos"("InsumosID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedidos" ADD CONSTRAINT "Pedidos_MesaID_fkey" FOREIGN KEY ("MesaID") REFERENCES "Mesas"("MesaID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedidos" ADD CONSTRAINT "Pedidos_ClienteID_fkey" FOREIGN KEY ("ClienteID") REFERENCES "Clientes"("ClienteID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedidos" ADD CONSTRAINT "Pedidos_RestauranteID_fkey" FOREIGN KEY ("RestauranteID") REFERENCES "Restaurantes"("RestauranteID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedidos" ADD CONSTRAINT "Pedidos_EmpleadoID_fkey" FOREIGN KEY ("EmpleadoID") REFERENCES "Empleados"("EmpleadoID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedidos" ADD CONSTRAINT "Pedidos_EstadoID_fkey" FOREIGN KEY ("EstadoID") REFERENCES "EstadosPedido"("EstadoID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetallePedidos" ADD CONSTRAINT "DetallePedidos_PedidoID_fkey" FOREIGN KEY ("PedidoID") REFERENCES "Pedidos"("PedidoID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetallePedidos" ADD CONSTRAINT "DetallePedidos_ItemID_fkey" FOREIGN KEY ("ItemID") REFERENCES "ItemsMenu"("ItemID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialEstadoPedido" ADD CONSTRAINT "HistorialEstadoPedido_PedidoID_fkey" FOREIGN KEY ("PedidoID") REFERENCES "Pedidos"("PedidoID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialEstadoPedido" ADD CONSTRAINT "HistorialEstadoPedido_EstadoID_fkey" FOREIGN KEY ("EstadoID") REFERENCES "EstadosPedido"("EstadoID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagos" ADD CONSTRAINT "Pagos_PedidoID_fkey" FOREIGN KEY ("PedidoID") REFERENCES "Pedidos"("PedidoID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagos" ADD CONSTRAINT "Pagos_MetodoID_fkey" FOREIGN KEY ("MetodoID") REFERENCES "MetodosPago"("MetodoID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facturas" ADD CONSTRAINT "Facturas_PedidoId_fkey" FOREIGN KEY ("PedidoId") REFERENCES "Pedidos"("PedidoID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Amigos" ADD CONSTRAINT "Amigos_UsuarioSolicitudID_fkey" FOREIGN KEY ("UsuarioSolicitudID") REFERENCES "Usuarios"("UsuarioID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Amigos" ADD CONSTRAINT "Amigos_UsuarioReceptorID_fkey" FOREIGN KEY ("UsuarioReceptorID") REFERENCES "Usuarios"("UsuarioID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensajeChat" ADD CONSTRAINT "MensajeChat_RemintenteID_fkey" FOREIGN KEY ("RemintenteID") REFERENCES "Usuarios"("UsuarioID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensajeChat" ADD CONSTRAINT "MensajeChat_ReceptorID_fkey" FOREIGN KEY ("ReceptorID") REFERENCES "Usuarios"("UsuarioID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensajeChat" ADD CONSTRAINT "MensajeChat_PedidoID_fkey" FOREIGN KEY ("PedidoID") REFERENCES "Pedidos"("PedidoID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificaciones" ADD CONSTRAINT "Notificaciones_UsuarioID_fkey" FOREIGN KEY ("UsuarioID") REFERENCES "Usuarios"("UsuarioID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResenasRestaurante" ADD CONSTRAINT "ResenasRestaurante_ClienteID_fkey" FOREIGN KEY ("ClienteID") REFERENCES "Clientes"("ClienteID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResenasRestaurante" ADD CONSTRAINT "ResenasRestaurante_RestauranteID_fkey" FOREIGN KEY ("RestauranteID") REFERENCES "Restaurantes"("RestauranteID") ON DELETE RESTRICT ON UPDATE CASCADE;
