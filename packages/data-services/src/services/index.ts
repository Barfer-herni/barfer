// ==========================================
// SERVICIOS DEL SISTEMA (MongoDB)
// ==========================================
export * from './authService';
export * from './dataService';
export * from './imageService';
export * from './uploadR2Image';
export * from './userService';
export * from './templateService';
export * from './balanceService';

// ==========================================
// SERVICIOS MIGRADOS A MONGODB
// ==========================================
export * from './salidasMongoService';
export * from './salidasAnalyticsMongoService';
export * from './categoriasMongoService';
export * from './metodosPagoMongoService';
export * from './categoriasProveedoresMongoService';
export * from './proveedoresMongoService';
export {
    createPuntoEnvioMongo,
    getAllPuntosEnvioMongo,
    getPuntoEnvioByIdMongo,
    updatePuntoEnvioMongo,
    deletePuntoEnvioMongo,
    getPuntoEnvioByNameMongo,
} from './puntoEnvioMongoService';
export * from './orderPriorityMongoService';
// stockMongoService y detalleEnvioMongoService están duplicados en barfer/stockService y barfer/detalleEnvioService
// Se exportan desde barfer/index.ts, no desde aquí para evitar conflictos
// export * from './stockMongoService';
// export * from './detalleEnvioMongoService';

// ==========================================
// SERVICIOS DE BARFER E-COMMERCE (MongoDB)
// ==========================================
export * from './mongoService';

// Exportar utilidades de mapeo de productos
export {
    mapSelectOptionToDBFormat,
    processOrderItems,
    type ProductMapping
} from './barfer/productMapping';

// Exportar servicios de Barfer - Solo Analytics que se usan
export {
    // Analytics (desde barfer/analytics/)
    getOrdersByDay,
    getRevenueByDay,
    getAverageOrderValue,
    getCustomerFrequency,
    getCustomerInsights,
    getProductSales,
    getPaymentMethodStats,
    getPaymentsByTimePeriod,
    getProductsByTimePeriod,
    getOrdersByMonth,
    getCategorySales,
    // Client Management (desde barfer/analytics/)
    getClientCategorization,
    getClientsByCategory,
    getClientsByCategoryPaginated,
    getClientGeneralStats,
    type ClientGeneralStats,
    getClientCategoriesStats,
    type ClientCategoriesStats,
    getClientsPaginated,
    getClientsPaginatedWithStatus,
    type ClientForTable,
    type ClientForTableWithStatus,
    type PaginatedClientsResponse,
    type PaginatedClientsWithStatusResponse,
    type ClientsPaginationOptions,
    getPurchaseFrequency,
    // WhatsApp Contact Management
    markWhatsAppContacted,
    getWhatsAppContactStatus,
} from './barfer';
