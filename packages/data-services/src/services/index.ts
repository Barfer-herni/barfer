// ==========================================
// SERVICIOS DEL SISTEMA (PostgreSQL/Prisma)
// ==========================================
export * from './authService';
export * from './dataService';
export * from './imageService';
export * from './uploadR2Image';
export * from './userService';
export * from './templateService';
// export * from './pricesService'; // DEPRECATED: Migrado a MongoDB en barfer/pricesCalculationService.ts
export * from './salidasService';
// export * from './salidasAnalyticsService'; // DEPRECATED: Migrado a MongoDB en salidasAnalyticsMongoService.ts
export { getSalidasDetailsByCategory } from './salidasService';
export * from './balanceService';
export * from './categoriasService';
export * from './metodosPagoService';

// ==========================================
// SERVICIOS MIGRADOS A MONGODB
// ==========================================
export * from './salidasMongoService';
export * from './salidasAnalyticsMongoService';
export * from './categoriasMongoService';
export * from './metodosPagoMongoService';
export * from './categoriasProveedoresMongoService';
export * from './proveedoresMongoService';

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
