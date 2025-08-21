// BARFER SERVICES - Solo funciones que se usan actualmente

// ===== ANALYTICS =====
export { getAverageOrderValue } from './analytics/getAverageOrderValue';
export { getCategorySales } from './analytics/getCategorySales';
export { getClientCategorization } from './analytics/getClientCategorization';
export { getClientsByCategory, getClientsByCategoryPaginated } from './analytics/getClientsByCategory';
export { getClientGeneralStats } from './analytics/getClientGeneralStats';
export type { ClientGeneralStats } from './analytics/getClientGeneralStats';
export { getClientCategoriesStats } from './analytics/getClientCategoriesStats';
export type { ClientCategoriesStats } from './analytics/getClientCategoriesStats';
export { getClientsPaginated, getClientsPaginatedWithStatus } from './analytics/getClientsPaginated';
export type {
    ClientsPaginationOptions,
    ClientForTable,
    ClientForTableWithStatus,
    PaginatedClientsResponse,
    PaginatedClientsWithStatusResponse
} from './analytics/getClientsPaginated';
export { getCustomerFrequency } from './analytics/getCustomerFrequency';
export { getCustomerInsights } from './analytics/getCustomerInsights';
export { getOrdersByDay } from './analytics/getOrdersByDay';
export { getOrdersByMonth, debugOrdersByMonth } from './analytics/getOrdersByMonth';
export { getPaymentMethodStats } from './analytics/getPaymentMethodStats';
export { getPaymentsByTimePeriod } from './analytics/getPaymentsByTimePeriod';
export { getProductSales } from './analytics/getProductSales';
export * from './analytics/getProductsByTimePeriod';
export { getPurchaseFrequency } from './analytics/getPurchaseFrequency';
export { getRevenueByDay } from './analytics/getRevenueByDay';
export * from './analytics/getDeliveryTypeStatsByMonth';
export * from './analytics/getProductTimeline';
export * from './analytics/getQuantityStatsByMonth';

// ===== ORDERS =====
export { getOrders } from './getOrders';
export { updateOrder } from './updateOrder';
export { deleteOrder } from './deleteOrder';
export { createOrder } from './createOrder';
export { migrateClientType } from './migrateClientType';

// ===== CLIENT MANAGEMENT =====
export { markWhatsAppContacted, getWhatsAppContactStatus } from './markWhatsAppContacted';

// ===== PRICES =====
export { getAllPrices, updateProductPrice, initializeBarferPrices } from './pricesService';
export type { BarferPriceData, BarferUpdatePriceData } from './pricesService';

// ===== REPARTOS =====
export {
    getRepartosData,
    saveRepartosWeek,
    updateRepartoEntry,
    toggleRepartoCompletion,
    initializeWeek,
    getRepartosStats,
    cleanupOldWeeks,
    addRowToDay,
    removeRowFromDay
} from './repartosService';