// BARFER SERVICES - Solo funciones que se usan actualmente

// ===== ANALYTICS =====
export { getAverageOrderValue } from './analytics/getAverageOrderValue';
export { getCategorySales } from './analytics/getCategorySales';
export { getClientCategorization } from './analytics/getClientCategorization';
export { getClientsByCategory } from './analytics/getClientsByCategory';
export { getCustomerFrequency } from './analytics/getCustomerFrequency';
export { getCustomerInsights } from './analytics/getCustomerInsights';
export { getOrdersByDay } from './analytics/getOrdersByDay';
export { getOrdersByMonth } from './analytics/getOrdersByMonth';
export { getPaymentMethodStats } from './analytics/getPaymentMethodStats';
export { getPaymentsByTimePeriod } from './analytics/getPaymentsByTimePeriod';
export { getProductSales } from './analytics/getProductSales';
export * from './analytics/getProductsByTimePeriod';
export { getPurchaseFrequency } from './analytics/getPurchaseFrequency';
export { getRevenueByDay } from './analytics/getRevenueByDay';
export * from './analytics/getDeliveryTypeStatsByMonth';
export * from './analytics/getProductTimeline';

// ===== ORDERS =====
export { getOrders } from './getOrders';
export { updateOrder } from './updateOrder';
export { deleteOrder } from './deleteOrder';
export { createOrder } from './createOrder';
export { migrateClientType } from './migrateClientType';

// ===== CLIENT MANAGEMENT =====
export { markWhatsAppContacted, getWhatsAppContactStatus } from './markWhatsAppContacted';