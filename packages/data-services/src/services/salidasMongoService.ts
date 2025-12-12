import { ObjectId, getCollection } from '@repo/database';
import { canViewSalidaCategory, getViewableCategories } from '@repo/auth/server-permissions';

// Tipos para el servicio MongoDB
export interface SalidaMongoData {
    _id: string;
    fechaFactura: Date | string;
    detalle: string;
    tipo: 'ORDINARIO' | 'EXTRAORDINARIO';
    marca?: string | null;
    monto: number;
    tipoRegistro: 'BLANCO' | 'NEGRO';
    categoriaId: string;
    metodoPagoId: string;
    proveedorId?: string | null;
    fechaPago?: Date | string | null;
    comprobanteNumber?: string | null;
    // Datos relacionados (populados)
    categoria?: {
        _id: string;
        nombre: string;
    };
    metodoPago?: {
        _id: string;
        nombre: string;
    };
    proveedor?: {
        _id: string;
        nombre: string;
        detalle: string;
        telefono: string;
        personaContacto: string;
        registro: 'BLANCO' | 'NEGRO';
    } | null;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface CreateSalidaMongoInput {
    fechaFactura: Date | string;
    detalle: string;
    categoriaId: string;
    tipo: 'ORDINARIO' | 'EXTRAORDINARIO';
    marca?: string;
    monto: number;
    metodoPagoId: string;
    tipoRegistro: 'BLANCO' | 'NEGRO';
    proveedorId?: string;
    fechaPago?: Date | string;
    comprobanteNumber?: string;
}

export interface UpdateSalidaMongoInput {
    fechaFactura?: Date | string;
    detalle?: string;
    categoriaId?: string;
    tipo?: 'ORDINARIO' | 'EXTRAORDINARIO';
    marca?: string;
    monto?: number;
    metodoPagoId?: string;
    tipoRegistro?: 'BLANCO' | 'NEGRO';
    proveedorId?: string;
    fechaPago?: Date | string;
    comprobanteNumber?: string;
}

// Servicios CRUD

/**
 * Obtener todas las salidas ordenadas por fecha (más recientes primero)
 */
export async function getAllSalidasMongo(): Promise<{
    success: boolean;
    salidas?: SalidaMongoData[];
    total?: number;
    message?: string;
    error?: string;
}> {
    try {
        const salidasCollection = await getCollection('salidas');
        const categoriasCollection = await getCollection('categorias');
        const metodosPagoCollection = await getCollection('metodos_pago');
        const proveedoresCollection = await getCollection('proveedores');

        const salidas = await salidasCollection
            .aggregate([
                {
                    $lookup: {
                        from: 'categorias',
                        localField: 'categoriaId',
                        foreignField: '_id',
                        as: 'categoria'
                    }
                },
                {
                    $lookup: {
                        from: 'metodos_pago',
                        localField: 'metodoPagoId',
                        foreignField: '_id',
                        as: 'metodoPago'
                    }
                },
                {
                    $lookup: {
                        from: 'proveedores',
                        localField: 'proveedorId',
                        foreignField: '_id',
                        as: 'proveedor'
                    }
                },
                {
                    $addFields: {
                        categoria: { $arrayElemAt: ['$categoria', 0] },
                        metodoPago: { $arrayElemAt: ['$metodoPago', 0] },
                        proveedor: { $arrayElemAt: ['$proveedor', 0] }
                    }
                },
                {
                    $sort: { fechaFactura: -1 }
                }
            ])
            .toArray();

        const formattedSalidas = salidas.map(salida => ({
            _id: salida._id.toString(),
            fechaFactura: salida.fechaFactura,
            detalle: salida.detalle,
            tipo: salida.tipo,
            marca: salida.marca,
            monto: salida.monto,
            tipoRegistro: salida.tipoRegistro,
            categoriaId: salida.categoriaId.toString(),
            metodoPagoId: salida.metodoPagoId.toString(),
            proveedorId: salida.proveedorId ? salida.proveedorId.toString() : null,
            fechaPago: salida.fechaPago,
            comprobanteNumber: salida.comprobanteNumber,
            categoria: salida.categoria ? {
                _id: salida.categoria._id.toString(),
                nombre: salida.categoria.nombre
            } : undefined,
            metodoPago: salida.metodoPago ? {
                _id: salida.metodoPago._id.toString(),
                nombre: salida.metodoPago.nombre
            } : undefined,
            proveedor: salida.proveedor ? {
                _id: salida.proveedor._id.toString(),
                nombre: salida.proveedor.nombre,
                detalle: salida.proveedor.detalle,
                telefono: salida.proveedor.telefono,
                personaContacto: salida.proveedor.personaContacto,
                registro: salida.proveedor.registro
            } : null,
            createdAt: salida.createdAt,
            updatedAt: salida.updatedAt
        }));

        return {
            success: true,
            salidas: formattedSalidas,
            total: formattedSalidas.length
        };
    } catch (error) {
        console.error('Error in getAllSalidasMongo:', error);
        return {
            success: false,
            message: 'Error al obtener las salidas',
            error: 'GET_ALL_SALIDAS_MONGO_ERROR'
        };
    }
}

/**
 * Obtener todas las salidas filtradas por permisos de categorías del usuario
 */
export async function getAllSalidasWithPermissionFilterMongo(): Promise<{
    success: boolean;
    salidas?: SalidaMongoData[];
    total?: number;
    message?: string;
    error?: string;
}> {
    try {
        const result = await getAllSalidasMongo();
        if (!result.success || !result.salidas) {
            return result;
        }

        // Filtrar salidas según permisos de categorías
        const filteredSalidas = [];
        for (const salida of result.salidas) {
            if (salida.categoria) {
                const canView = await canViewSalidaCategory(salida.categoria.nombre);
                if (canView) {
                    filteredSalidas.push(salida);
                }
            }
        }

        return {
            success: true,
            salidas: filteredSalidas,
            total: filteredSalidas.length
        };
    } catch (error) {
        console.error('Error in getAllSalidasWithPermissionFilterMongo:', error);
        return {
            success: false,
            message: 'Error al obtener las salidas',
            error: 'GET_ALL_SALIDAS_WITH_PERMISSION_FILTER_MONGO_ERROR'
        };
    }
}

/**
 * Filtros de búsqueda para salidas
 */
export interface SalidasFilters {
    searchTerm?: string;
    categoriaId?: string;
    marca?: string;
    metodoPagoId?: string;
    tipo?: 'ORDINARIO' | 'EXTRAORDINARIO';
    tipoRegistro?: 'BLANCO' | 'NEGRO';
    fecha?: string; // Formato ISO date string (legacy)
    fechaDesde?: Date; // Fecha de inicio del rango
    fechaHasta?: Date; // Fecha de fin del rango
}

/**
 * Obtener salidas paginadas con filtros de permisos (OPTIMIZADO)
 */
export async function getSalidasPaginatedMongo({
    pageIndex = 0,
    pageSize = 50,
    filters = {},
}: {
    pageIndex?: number;
    pageSize?: number;
    filters?: SalidasFilters;
}): Promise<{
    success: boolean;
    salidas?: SalidaMongoData[];
    total?: number;
    pageCount?: number;
    message?: string;
    error?: string;
}> {
    try {
        console.time('⏱️ getSalidasPaginatedMongo');
        const salidasCollection = await getCollection('salidas');

        // 1. Obtener categorías visibles UNA SOLA VEZ
        console.time('⏱️ getViewableCategories');
        const viewableCategories = await getViewableCategories();
        console.timeEnd('⏱️ getViewableCategories');
        console.log(`✅ Categorías visibles: ${JSON.stringify(viewableCategories)}`);

        // 2. Construir pipeline de agregación
        const pipeline: any[] = [
            // Lookup de categoría primero para poder filtrar
            {
                $lookup: {
                    from: 'categorias',
                    localField: 'categoriaId',
                    foreignField: '_id',
                    as: 'categoria'
                }
            },
            {
                $addFields: {
                    categoria: { $arrayElemAt: ['$categoria', 0] }
                }
            }
        ];

        // 3. Si NO es admin (viewableCategories !== ['*']), filtrar por categorías permitidas
        const matchConditions: any = {};

        if (!viewableCategories.includes('*')) {
            if (viewableCategories.length === 0) {
                // Usuario sin permisos - retornar vacío
                return {
                    success: true,
                    salidas: [],
                    total: 0,
                    pageCount: 0
                };
            }

            // Filtrar solo las categorías permitidas
            matchConditions['categoria.nombre'] = { $in: viewableCategories };
            console.log(`🔒 Filtrando por categorías: ${viewableCategories.join(', ')}`);
        } else {
            console.log(`🔓 Admin - sin filtro de categorías`);
        }

        // 4. Aplicar filtros adicionales del usuario
        if (filters.categoriaId) {
            const categoriasCollection = await getCollection('categorias');
            const categoria = await categoriasCollection.findOne({ _id: new ObjectId(filters.categoriaId) });
            if (categoria) {
                // Si ya hay un filtro de permisos, combinar con AND
                if (matchConditions['categoria.nombre']) {
                    // Asegurar que la categoría seleccionada esté en las permitidas
                    if (Array.isArray(matchConditions['categoria.nombre'].$in)) {
                        if (matchConditions['categoria.nombre'].$in.includes(categoria.nombre)) {
                            matchConditions['categoria.nombre'] = categoria.nombre;
                        } else {
                            // La categoría seleccionada no está permitida, retornar vacío
                            return {
                                success: true,
                                salidas: [],
                                total: 0,
                                pageCount: 0
                            };
                        }
                    }
                } else {
                    matchConditions['categoria.nombre'] = categoria.nombre;
                }
                console.log(`🔍 Filtro categoría: ${categoria.nombre}`);
            }
        }

        if (filters.marca) {
            matchConditions['marca'] = filters.marca;
            console.log(`🔍 Filtro marca: ${filters.marca}`);
        }

        if (filters.tipo) {
            matchConditions['tipo'] = filters.tipo;
            console.log(`🔍 Filtro tipo: ${filters.tipo}`);
        }

        if (filters.tipoRegistro) {
            matchConditions['tipoRegistro'] = filters.tipoRegistro;
            console.log(`🔍 Filtro tipo registro: ${filters.tipoRegistro}`);
        }

        // Manejar filtros de fecha (prioridad: fechaDesde/fechaHasta > fecha)
        if (filters.fechaDesde || filters.fechaHasta) {
            matchConditions['fechaFactura'] = {};
            if (filters.fechaDesde) {
                matchConditions['fechaFactura'].$gte = filters.fechaDesde;
                console.log(`🔍 Filtro fecha desde: ${filters.fechaDesde.toISOString()}`);
            }
            if (filters.fechaHasta) {
                matchConditions['fechaFactura'].$lte = filters.fechaHasta;
                console.log(`🔍 Filtro fecha hasta: ${filters.fechaHasta.toISOString()}`);
            }
        } else if (filters.fecha) {
            // Parsear fecha y crear rango para el día completo (legacy)
            const dateObj = new Date(filters.fecha);
            const startOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0);
            const endOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59, 999);

            matchConditions['fechaFactura'] = {
                $gte: startOfDay,
                $lte: endOfDay
            };
            console.log(`🔍 Filtro fecha: ${filters.fecha}`);
        }

        // Agregar $match si hay condiciones
        if (Object.keys(matchConditions).length > 0) {
            pipeline.push({
                $match: matchConditions
            });
        }

        // 5. Agregar resto de lookups
        pipeline.push(
            {
                $lookup: {
                    from: 'metodos_pago',
                    localField: 'metodoPagoId',
                    foreignField: '_id',
                    as: 'metodoPago'
                }
            },
            {
                $lookup: {
                    from: 'proveedores',
                    localField: 'proveedorId',
                    foreignField: '_id',
                    as: 'proveedor'
                }
            },
            {
                $addFields: {
                    metodoPago: { $arrayElemAt: ['$metodoPago', 0] },
                    proveedor: { $arrayElemAt: ['$proveedor', 0] }
                }
            }
        );

        // 6. Aplicar filtros que requieren lookups (después de los lookups)
        const postLookupConditions: any[] = [];

        if (filters.metodoPagoId) {
            const metodosPagoCollection = await getCollection('metodos_pago');
            const metodoPago = await metodosPagoCollection.findOne({ _id: new ObjectId(filters.metodoPagoId) });
            if (metodoPago) {
                postLookupConditions.push({
                    'metodoPago.nombre': metodoPago.nombre
                });
                console.log(`🔍 Filtro método pago: ${metodoPago.nombre}`);
            }
        }

        // 7. Filtro de búsqueda de texto (después de lookups para buscar en campos relacionados)
        if (filters.searchTerm && filters.searchTerm.trim() !== '') {
            const searchRegex = { $regex: filters.searchTerm, $options: 'i' };
            postLookupConditions.push({
                $or: [
                    { detalle: searchRegex },
                    { 'categoria.nombre': searchRegex },
                    { 'proveedor.nombre': searchRegex },
                    { marca: searchRegex },
                    { 'metodoPago.nombre': searchRegex },
                    { monto: isNaN(Number(filters.searchTerm)) ? -1 : Number(filters.searchTerm) }
                ]
            });
            console.log(`🔍 Búsqueda de texto: ${filters.searchTerm}`);
        }

        // Agregar condiciones post-lookup si existen
        if (postLookupConditions.length > 0) {
            pipeline.push({
                $match: postLookupConditions.length === 1
                    ? postLookupConditions[0]
                    : { $and: postLookupConditions }
            });
        }

        // 8. Ordenar
        pipeline.push({
            $sort: { fechaFactura: -1 }
        });

        // 9. Contar total ANTES de paginar (más eficiente)
        console.time('⏱️ count');
        const countPipeline = [...pipeline, { $count: 'total' }];
        const countResult = await salidasCollection.aggregate(countPipeline).toArray();
        const total = countResult.length > 0 ? countResult[0].total : 0;
        const pageCount = Math.ceil(total / pageSize);
        console.timeEnd('⏱️ count');
        console.log(`📊 Total: ${total}, Páginas: ${pageCount}`);

        // 10. Aplicar paginación en MongoDB
        pipeline.push(
            { $skip: pageIndex * pageSize },
            { $limit: pageSize }
        );

        // 11. Ejecutar query paginada
        console.time('⏱️ query');
        const salidas = await salidasCollection.aggregate(pipeline).toArray();
        console.timeEnd('⏱️ query');
        console.log(`📄 Salidas obtenidas: ${salidas.length}`);

        // 12. Formatear salidas
        const formattedSalidas = salidas.map(salida => ({
            _id: salida._id.toString(),
            fechaFactura: salida.fechaFactura,
            detalle: salida.detalle,
            tipo: salida.tipo,
            marca: salida.marca,
            monto: salida.monto,
            tipoRegistro: salida.tipoRegistro,
            categoriaId: salida.categoriaId.toString(),
            metodoPagoId: salida.metodoPagoId.toString(),
            proveedorId: salida.proveedorId ? salida.proveedorId.toString() : null,
            fechaPago: salida.fechaPago,
            comprobanteNumber: salida.comprobanteNumber,
            categoria: salida.categoria ? {
                _id: salida.categoria._id.toString(),
                nombre: salida.categoria.nombre
            } : undefined,
            metodoPago: salida.metodoPago ? {
                _id: salida.metodoPago._id.toString(),
                nombre: salida.metodoPago.nombre
            } : undefined,
            proveedor: salida.proveedor ? {
                _id: salida.proveedor._id.toString(),
                nombre: salida.proveedor.nombre,
                detalle: salida.proveedor.detalle,
                telefono: salida.proveedor.telefono,
                personaContacto: salida.proveedor.personaContacto,
                registro: salida.proveedor.registro
            } : null,
            createdAt: salida.createdAt,
            updatedAt: salida.updatedAt
        }));

        console.timeEnd('⏱️ getSalidasPaginatedMongo');

        return {
            success: true,
            salidas: formattedSalidas,
            total,
            pageCount
        };
    } catch (error) {
        console.error('❌ Error in getSalidasPaginatedMongo:', error);
        return {
            success: false,
            message: 'Error al obtener las salidas paginadas',
            error: 'GET_SALIDAS_PAGINATED_MONGO_ERROR'
        };
    }
}

/**
 * Obtener una salida por ID
 */
export async function getSalidaByIdMongo(id: string): Promise<{
    success: boolean;
    salida?: SalidaMongoData;
    message?: string;
    error?: string;
}> {
    try {
        const salidasCollection = await getCollection('salidas');

        const salida = await salidasCollection
            .aggregate([
                { $match: { _id: new ObjectId(id) } },
                {
                    $lookup: {
                        from: 'categorias',
                        localField: 'categoriaId',
                        foreignField: '_id',
                        as: 'categoria'
                    }
                },
                {
                    $lookup: {
                        from: 'metodos_pago',
                        localField: 'metodoPagoId',
                        foreignField: '_id',
                        as: 'metodoPago'
                    }
                },
                {
                    $lookup: {
                        from: 'proveedores',
                        localField: 'proveedorId',
                        foreignField: '_id',
                        as: 'proveedor'
                    }
                },
                {
                    $addFields: {
                        categoria: { $arrayElemAt: ['$categoria', 0] },
                        metodoPago: { $arrayElemAt: ['$metodoPago', 0] },
                        proveedor: { $arrayElemAt: ['$proveedor', 0] }
                    }
                }
            ])
            .toArray();

        if (salida.length === 0) {
            return {
                success: false,
                message: 'Salida no encontrada',
                error: 'SALIDA_NOT_FOUND'
            };
        }

        const salidaData = salida[0];
        const formattedSalida: SalidaMongoData = {
            _id: salidaData._id.toString(),
            fechaFactura: salidaData.fechaFactura,
            detalle: salidaData.detalle,
            tipo: salidaData.tipo,
            marca: salidaData.marca,
            monto: salidaData.monto,
            tipoRegistro: salidaData.tipoRegistro,
            categoriaId: salidaData.categoriaId.toString(),
            metodoPagoId: salidaData.metodoPagoId.toString(),
            proveedorId: salidaData.proveedorId ? salidaData.proveedorId.toString() : null,
            fechaPago: salidaData.fechaPago,
            comprobanteNumber: salidaData.comprobanteNumber,
            categoria: salidaData.categoria ? {
                _id: salidaData.categoria._id.toString(),
                nombre: salidaData.categoria.nombre
            } : undefined,
            metodoPago: salidaData.metodoPago ? {
                _id: salidaData.metodoPago._id.toString(),
                nombre: salidaData.metodoPago.nombre
            } : undefined,
            proveedor: salidaData.proveedor ? {
                _id: salidaData.proveedor._id.toString(),
                nombre: salidaData.proveedor.nombre,
                detalle: salidaData.proveedor.detalle,
                telefono: salidaData.proveedor.telefono,
                personaContacto: salidaData.proveedor.personaContacto,
                registro: salidaData.proveedor.registro
            } : null,
            createdAt: salidaData.createdAt,
            updatedAt: salidaData.updatedAt
        };

        return {
            success: true,
            salida: formattedSalida
        };
    } catch (error) {
        console.error('Error in getSalidaByIdMongo:', error);
        return {
            success: false,
            message: 'Error al obtener la salida',
            error: 'GET_SALIDA_BY_ID_MONGO_ERROR'
        };
    }
}

/**
 * Crear una nueva salida
 */
export async function createSalidaMongo(data: CreateSalidaMongoInput): Promise<{
    success: boolean;
    salida?: SalidaMongoData;
    message?: string;
    error?: string;
}> {
    try {
        const salidasCollection = await getCollection('salidas');

        // Construir documento para insertar
        const salidaDoc: any = {
            fechaFactura: data.fechaFactura,
            detalle: data.detalle,
            categoriaId: new ObjectId(data.categoriaId),
            tipo: data.tipo,
            monto: data.monto,
            metodoPagoId: new ObjectId(data.metodoPagoId),
            tipoRegistro: data.tipoRegistro,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Agregar campos opcionales
        if (data.marca !== undefined) salidaDoc.marca = data.marca;
        if (data.proveedorId !== undefined) salidaDoc.proveedorId = new ObjectId(data.proveedorId);
        if (data.fechaPago !== undefined) salidaDoc.fechaPago = data.fechaPago;
        if (data.comprobanteNumber !== undefined) salidaDoc.comprobanteNumber = data.comprobanteNumber;

        const result = await salidasCollection.insertOne(salidaDoc);

        // Obtener la salida creada con datos relacionados
        const createdSalida = await getSalidaByIdMongo(result.insertedId.toString());

        return {
            success: true,
            salida: createdSalida.salida,
            message: 'Salida creada exitosamente'
        };
    } catch (error) {
        console.error('Error in createSalidaMongo:', error);
        return {
            success: false,
            message: 'Error al crear la salida',
            error: 'CREATE_SALIDA_MONGO_ERROR'
        };
    }
}

/**
 * Actualizar una salida existente
 */
export async function updateSalidaMongo(id: string, data: UpdateSalidaMongoInput): Promise<{
    success: boolean;
    salida?: SalidaMongoData;
    message?: string;
    error?: string;
}> {
    try {
        const salidasCollection = await getCollection('salidas');

        // Construir objeto de actualización
        const updateData: any = {
            updatedAt: new Date()
        };

        // Agregar campos solo si están presentes
        if (data.fechaFactura !== undefined) updateData.fechaFactura = data.fechaFactura;
        if (data.detalle !== undefined) updateData.detalle = data.detalle;
        if (data.categoriaId !== undefined) updateData.categoriaId = new ObjectId(data.categoriaId);
        if (data.tipo !== undefined) updateData.tipo = data.tipo;
        if (data.marca !== undefined) updateData.marca = data.marca;
        if (data.monto !== undefined) updateData.monto = data.monto;
        if (data.metodoPagoId !== undefined) updateData.metodoPagoId = new ObjectId(data.metodoPagoId);
        if (data.tipoRegistro !== undefined) updateData.tipoRegistro = data.tipoRegistro;
        if (data.proveedorId !== undefined) updateData.proveedorId = data.proveedorId ? new ObjectId(data.proveedorId) : null;
        if (data.fechaPago !== undefined) updateData.fechaPago = data.fechaPago;
        if (data.comprobanteNumber !== undefined) updateData.comprobanteNumber = data.comprobanteNumber;

        const result = await salidasCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return {
                success: false,
                message: 'Salida no encontrada',
                error: 'SALIDA_NOT_FOUND'
            };
        }

        // Obtener la salida actualizada
        const updatedSalida = await getSalidaByIdMongo(id);

        return {
            success: true,
            salida: updatedSalida.salida,
            message: 'Salida actualizada exitosamente'
        };
    } catch (error) {
        console.error('Error in updateSalidaMongo:', error);
        return {
            success: false,
            message: 'Error al actualizar la salida',
            error: 'UPDATE_SALIDA_MONGO_ERROR'
        };
    }
}

/**
 * Eliminar una salida
 */
export async function deleteSalidaMongo(id: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
}> {
    try {
        const salidasCollection = await getCollection('salidas');

        const result = await salidasCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return {
                success: false,
                message: 'Salida no encontrada',
                error: 'SALIDA_NOT_FOUND'
            };
        }

        return {
            success: true,
            message: 'Salida eliminada exitosamente'
        };
    } catch (error) {
        console.error('Error in deleteSalidaMongo:', error);
        return {
            success: false,
            message: 'Error al eliminar la salida',
            error: 'DELETE_SALIDA_MONGO_ERROR'
        };
    }
}

// Servicios de filtrado y búsqueda

/**
 * Obtener salidas por rango de fechas
 */
export async function getSalidasByDateRangeMongo(startDate: Date, endDate: Date): Promise<{
    success: boolean;
    salidas?: SalidaMongoData[];
    total?: number;
    message?: string;
    error?: string;
}> {
    try {
        const salidasCollection = await getCollection('salidas');

        const salidas = await salidasCollection
            .find({
                fechaFactura: {
                    $gte: startDate,
                    $lte: endDate
                }
            })
            .sort({ fechaFactura: -1 })
            .toArray();

        const formattedSalidas = salidas.map(salida => ({
            _id: salida._id.toString(),
            fechaFactura: salida.fechaFactura,
            detalle: salida.detalle,
            tipo: salida.tipo,
            marca: salida.marca,
            monto: salida.monto,
            tipoRegistro: salida.tipoRegistro,
            categoriaId: salida.categoriaId.toString(),
            metodoPagoId: salida.metodoPagoId.toString(),
            proveedorId: salida.proveedorId ? salida.proveedorId.toString() : null,
            fechaPago: salida.fechaPago,
            comprobanteNumber: salida.comprobanteNumber,
            createdAt: salida.createdAt,
            updatedAt: salida.updatedAt
        }));

        return {
            success: true,
            salidas: formattedSalidas,
            total: formattedSalidas.length
        };
    } catch (error) {
        console.error('Error in getSalidasByDateRangeMongo:', error);
        return {
            success: false,
            message: 'Error al obtener salidas por rango de fechas',
            error: 'GET_SALIDAS_BY_DATE_RANGE_MONGO_ERROR'
        };
    }
}

/**
 * Obtener estadísticas de salidas por mes
 */
export async function getSalidasStatsByMonthMongo(year: number, month: number): Promise<{
    success: boolean;
    stats?: {
        totalSalidas: number;
        totalMonto: number;
        salidasOrdinarias: number;
        salidasExtraordinarias: number;
        montoOrdinario: number;
        montoExtraordinario: number;
        salidasBlancas: number;
        salidasNegras: number;
        montoBlanco: number;
        montoNegro: number;
    };
    message?: string;
    error?: string;
}> {
    try {
        const salidasCollection = await getCollection('salidas');
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const salidas = await salidasCollection
            .find({
                fechaFactura: {
                    $gte: startDate,
                    $lte: endDate
                }
            })
            .toArray();

        const stats = {
            totalSalidas: salidas.length,
            totalMonto: salidas.reduce((sum, s) => sum + s.monto, 0),
            salidasOrdinarias: salidas.filter(s => s.tipo === 'ORDINARIO').length,
            salidasExtraordinarias: salidas.filter(s => s.tipo === 'EXTRAORDINARIO').length,
            montoOrdinario: salidas.filter(s => s.tipo === 'ORDINARIO').reduce((sum, s) => sum + s.monto, 0),
            montoExtraordinario: salidas.filter(s => s.tipo === 'EXTRAORDINARIO').reduce((sum, s) => sum + s.monto, 0),
            salidasBlancas: salidas.filter(s => s.tipoRegistro === 'BLANCO').length,
            salidasNegras: salidas.filter(s => s.tipoRegistro === 'NEGRO').length,
            montoBlanco: salidas.filter(s => s.tipoRegistro === 'BLANCO').reduce((sum, s) => sum + s.monto, 0),
            montoNegro: salidas.filter(s => s.tipoRegistro === 'NEGRO').reduce((sum, s) => sum + s.monto, 0),
        };

        return {
            success: true,
            stats
        };
    } catch (error) {
        console.error('Error in getSalidasStatsByMonthMongo:', error);
        return {
            success: false,
            message: 'Error al obtener estadísticas de salidas',
            error: 'GET_SALIDAS_STATS_BY_MONTH_MONGO_ERROR'
        };
    }
}
