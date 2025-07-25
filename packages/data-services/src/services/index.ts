// ==========================================
// SERVICIOS DEL SISTEMA (PostgreSQL/Prisma)
// ==========================================
export * from './authService';
export * from './dataService';
export * from './imageService';
export * from './uploadR2Image';
export * from './userService';
export * from './templateService';
export * from './pricesService';
export * from './salidasService';
export * from './salidasAnalyticsService';
export { getSalidasDetailsByCategory } from './salidasService';
export * from './balanceService';
export * from './categoriasService';
export * from './metodosPagoService';

// ==========================================
// SERVICIOS DE BARFER E-COMMERCE (MongoDB)
// ==========================================
export * from './mongoService';

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
