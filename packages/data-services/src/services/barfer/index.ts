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
export {
    getAllPrices as getAllBarferPrices,
    getPrices as getBarferPrices,
    createPrice as createBarferPrice,
    updatePrice as updateBarferPrice,
    deletePrice as deleteBarferPrice,
    getAllUniqueProducts as getAllUniqueBarferProducts,
    deleteProductPrices as deleteBarferProductPrices,
    updateProductPrices as updateBarferProductPrices,
    updateProductPriceTypes as updateBarferProductPriceTypes,
    getCurrentPrices as getCurrentBarferPrices,
    getPriceHistory as getBarferPriceHistory,
    getPriceStats as getBarferPriceStats,
    initializeBarferPrices,
    initializePricesForPeriod
} from './pricesService';
export { getPricesByMonth, getPriceEvolution, comparePricesPeriods, getMostVolatilePrices, getPriceChangesSummary } from './priceHistoryService';
export { normalizePricesCapitalization, removeDuplicatePrices } from './normalizePricesCapitalization';

// ===== CÁLCULO DE PRECIOS PARA ÓRDENES =====
export { getProductPrice, calculateOrderTotal, debugPriceCalculation } from './pricesCalculationService';

// ===== PRODUCTOS GESTOR =====
export {
    getAllProductosGestor,
    createProductoGestor,
    updateProductoGestor,
    deleteProductoGestor,
    initializeProductosGestor
} from './productosGestorService';
export type { ProductoGestor, CreateProductoGestorData, UpdateProductoGestorData } from '../../types/barfer';

// ===== REPARTOS =====
export {
    getRepartosData,
    saveRepartosWeek,
    updateRepartoEntry,
    toggleRepartoCompletion,
    initializeWeek,
    getRepartosStats,
    cleanupOldWeeks,
    cleanupDuplicateWeeks,
    addRowToDay,
    removeRowFromDay
} from './repartosService';

// ===== MAYORISTA ORDERS =====
export {
    createMayoristaPerson,
    getMayoristaPersons,
    getMayoristaPersonById,
    updateMayoristaPerson,
    deleteMayoristaPerson,
    findMayoristaByName,
    searchMayoristas
} from './createMayoristaOrder';

// ===== MAYORISTA ORDERS TABLE =====
export {
    getMayoristaOrdersForTable,
    getMayoristaOrdersStats
} from './getMayoristaOrdersForTable';
export type {
    MayoristaOrdersPaginationOptions,
    PaginatedMayoristaOrdersResponse
} from './getMayoristaOrdersForTable';

// ===== PUNTOS DE VENTA MAYORISTAS =====
export {
    getMayoristas,
    getMayoristaById,
    createMayorista,
    updateMayorista,
    deleteMayorista,
    addKilosMes,
    getVentasPorZona,
    searchPuntosVenta
} from './mayoristasService';
export type {
    Mayorista,
    MayoristaCreateInput,
    MayoristaUpdateInput,
    MayoristaZona,
    MayoristaFrecuencia,
    MayoristaTipoNegocio
} from './mayoristasService';

// ===== ESTADÍSTICAS PUNTOS DE VENTA =====
export {
    getPuntosVentaStats
} from './puntosVentaStatsService';
export type {
    PuntoVentaStats
} from './puntosVentaStatsService';

// ===== MATRIZ DE PRODUCTOS =====
export {
    getProductosMatrix
} from './productosMatrixService';
export type {
    ProductoMatrixData
} from './productosMatrixService';