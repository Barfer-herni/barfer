// Tipos para la base de datos Barfer MongoDB

import { ObjectId } from '@repo/database';

export interface Product {
    _id: string;
    name: string;
    description: string;
    category: Category;
    images: string[];
    options: ProductOption[];
    salesCount: number;
    createdAt: string;
    updatedAt: string;
    sameDayDelivery: boolean;
}

export interface ProductOption {
    _id: string;
    name: string;
    description: string;
    stock: number;
    price: number;
    productId: string;
    createdAt: string;
    updatedAt: string;
    discount?: Discount;
}

export interface Category {
    _id: string;
    name: string;
    description: string;
    discountAmount?: number;
    discountPerAdditionalProduct?: number;
    discountThreshold?: number;
}

// interfaz order 
export interface Order {
    _id: string;
    status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
    total: number;
    items: OrderItem[];
    subTotal: number;
    shippingPrice: number;
    notes: string;
    notesOwn: string;
    address: Address;
    user: User;
    paymentMethod: string;
    coupon: Coupon | null;
    deliveryArea: DeliveryArea;
    orderType: 'minorista' | 'mayorista';
    deliveryDay: string;
    puntoEnvio?: string; // Nombre del punto de envío express (conecta con DeliveryArea.puntoEnvio)
    whatsappContactedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface OrderItem {
    id: string;
    name: string;
    description: string;
    images: string[];
    options: ProductOption[];
    price: number;
    salesCount: number;
    discountApllied: number;
}

export interface User {
    _id: string;
    email: string;
    password: string;
    name: string;
    lastName?: string;
    phoneNumber?: string;
    role: number;
    resetPasswordToken?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface Address {
    _id: string;
    userId: string;
    address: string;
    reference?: string;
    firstName: string;
    lastName: string;
    zipCode: string;
    phone: string;
    email: string;
    floorNumber?: string;
    departmentNumber?: string;
    betweenStreets?: string;
    city?: string;
    createdAt: string;
    updatedAt: string;
}

export interface DeliveryArea {
    _id: string;
    description: string;
    coordinates: number[][];
    schedule: string;
    orderCutOffHour: number;
    enabled: boolean;
    sameDayDelivery: boolean;
    sameDayDeliveryDays: string[];
    whatsappNumber: string;
    sheetName: string;
    puntoEnvio?: string; // Nombre del punto de envío express (ej: "Córdoba")
    createdAt: string;
    updatedAt: string;
}

export interface Coupon {
    _id: string;
    count: number;
    code: string;
    limit: number;
    description: string;
    type: 'percentage' | 'fixed';
    value: number;
    applicableProductOption: string | null;
    maxAplicableUnits: number;
    usedByUsers: Record<string, boolean>;
    createdAt: string;
    updatedAt: string;
}

export interface Ally {
    _id: string;
    name: string;
    address: string;
    contact: string;
    ig: string;
    region: string;
    hours: string;
    latitude: number;
    longitude: number;
}

export interface BankInfo {
    _id: string;
    cvu: string;
    alias: string;
    cuit: string;
    businessName: string;
    createdAt: string;
    updatedAt: string;
}

export interface Event {
    _id: string;
    title: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Discount {
    id: string;
    description: string;
    initialQuantity: number;
    initialDiscountAmount: number;
    additionalDiscountAmount: number;
    applicableOptionIds: string[];
}

// Tipos para respuestas de servicios
export interface DashboardStats {
    totalProducts: number;
    totalOrders: number;
    totalUsers: number;
    totalRevenue: number;
    pendingOrders: number;
    completedOrders: number;
    topProducts: Product[];
    recentOrders: Order[];
}

// Tipos para categorización de clientes
export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';

export type ClientBehaviorCategory =
    | 'new'
    | 'active'
    | 'possible-inactive'
    | 'lost'
    | 'recovered'
    | 'tracking';

export type ClientSpendingCategory = 'premium' | 'standard' | 'basic';

export interface ClientCategorization {
    _id: string; // Email del usuario (ya que user._id no existe en las órdenes)
    user: User;
    lastAddress?: Address;
    behaviorCategory: ClientBehaviorCategory;
    spendingCategory: ClientSpendingCategory;
    totalOrders: number;
    totalSpent: number;
    totalWeight: number;
    monthlyWeight: number;
    monthlySpending: number;
    firstOrderDate: string;
    lastOrderDate: string;
    daysSinceFirstOrder: number;
    daysSinceLastOrder: number;
    averageOrderValue: number;
}

export interface ClientCategoryStats {
    category: ClientBehaviorCategory | ClientSpendingCategory;
    count: number;
    totalSpent: number;
    averageSpending: number;
    percentage: number;
}

export interface ClientAnalytics {
    totalClients: number;
    behaviorCategories: ClientCategoryStats[];
    spendingCategories: ClientCategoryStats[];
    clients: ClientCategorization[];
    summary: {
        averageOrderValue: number;
        repeatCustomerRate: number;
        averageOrdersPerCustomer: number;
        averageMonthlySpending: number;
    };
}

// Interfaz para datos personales del mayorista (solo información básica)
export interface MayoristaPerson {
    _id?: string;
    user: {
        name: string;
        lastName: string;
        email: string;
    };
    address: {
        address: string;
        city: string;
        phone: string;
        betweenStreets?: string;
        floorNumber?: string;
        departmentNumber?: string;
    };
    createdAt: string;
    updatedAt: string;
}

// Interfaz para órdenes mayoristas (sin fecha y con estructura de items específica)
export interface MayoristaOrder {
    _id?: string;
    status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
    total: number;
    subTotal: number;
    shippingPrice: number;
    notes: string;
    notesOwn: string;
    address: {
        address: string;
        city: string;
        phone: string;
        betweenStreets?: string;
        floorNumber?: string;
        departmentNumber?: string;
    };
    user: {
        name: string;
        lastName: string;
        email: string;
    };
    items: OrderItem[];
    deliveryArea: {
        _id: string;
        description: string;
        coordinates: number[][];
        schedule: string;
        orderCutOffHour: number;
        enabled: boolean;
        sameDayDelivery: boolean;
        sameDayDeliveryDays: string[];
        whatsappNumber: string;
        sheetName: string;
    };
    paymentMethod: string;
    orderType: 'mayorista';
    deliveryDay: string;
    whatsappContactedAt?: string;
    createdAt: string;
    updatedAt: string;
}

// Enums para precios (equivalentes a los de Prisma)
export type PriceSection = 'PERRO' | 'GATO' | 'OTROS' | 'RAW';
export type PriceType = 'EFECTIVO' | 'TRANSFERENCIA' | 'MAYORISTA';

// Interfaz principal para precios con historial
export interface Price {
    _id: string | ObjectId;
    section: PriceSection;
    product: string;
    weight?: string; // 5KG, 10KG (opcional para algunos productos)
    priceType: PriceType;
    price: number;
    isActive: boolean;
    // Campos de fecha para historial
    effectiveDate: string; // Fecha desde cuando es efectivo este precio (YYYY-MM-DD)
    month: number; // Mes (1-12) para consultas rápidas
    year: number; // Año para consultas rápidas
    createdAt: string;
    updatedAt: string;
}

// Interfaz para consultar precios históricos
export interface PriceHistoryQuery {
    section?: PriceSection;
    product?: string;
    weight?: string;
    priceType?: PriceType;
    month?: number;
    year?: number;
    effectiveDate?: string;
    isActive?: boolean;
}

// Interfaz para crear/actualizar precios
export interface CreatePriceData {
    section: PriceSection;
    product: string;
    weight?: string;
    priceType: PriceType;
    price: number;
    isActive?: boolean;
    effectiveDate?: string; // Si no se proporciona, usa la fecha actual
}

export interface UpdatePriceData {
    price?: number;
    isActive?: boolean;
    effectiveDate?: string; // Para cambios de precio con fecha específica
}

// Interfaz para respuesta de historial de precios
export interface PriceHistory {
    product: string;
    section: PriceSection;
    weight?: string;
    priceType: PriceType;
    history: {
        price: number;
        effectiveDate: string;
        month: number;
        year: number;
        createdAt: string;
    }[];
}

// Interfaz para estadísticas de precios
export interface PriceStats {
    totalPrices: number;
    pricesBySection: Record<PriceSection, number>;
    pricesByType: Record<PriceType, number>;
    averagePriceBySection: Record<PriceSection, number>;
    priceChangesThisMonth: number;
    mostRecentChanges: Price[];
}

// ===== PRODUCTOS GESTOR =====
export interface ProductoGestor {
    _id: string | ObjectId;
    section: PriceSection;
    product: string;
    weight?: string; // 5KG, 10KG, etc. (opcional)
    priceTypes: PriceType[]; // Qué tipos de precio maneja este producto
    isActive: boolean;
    order: number; // Para ordenar los productos
    createdAt: string;
    updatedAt: string;
}

export interface CreateProductoGestorData {
    section: PriceSection;
    product: string;
    weight?: string;
    priceTypes: PriceType[];
    isActive?: boolean;
    order?: number;
}

export interface UpdateProductoGestorData {
    section?: PriceSection;
    product?: string;
    weight?: string;
    priceTypes?: PriceType[];
    isActive?: boolean;
    order?: number;
}

// ===== NOTA: PUNTO DE ENVÍO =====
// Los puntos de envío se manejan mediante el campo `puntoEnvio` en DeliveryArea y Order
// No hay una colección separada. El campo `puntoEnvio` conecta:
// - DeliveryArea.puntoEnvio: Define qué delivery area es un punto de envío express
// - Order.puntoEnvio: Conecta la orden con el punto de envío
// - Stock.puntoEnvio: Conecta el stock con el punto de envío
// - DetalleEnvio.puntoEnvio: Conecta el detalle con el punto de envío

// ===== DETALLE DE ENVÍO =====
// Similar a ProductQuantity, representa la cantidad de KG vendido por mes
export interface DetalleEnvio {
    _id: string | ObjectId;
    puntoEnvio: string; // Nombre del punto de envío (conecta con DeliveryArea.puntoEnvio y Order.puntoEnvio)
    fecha: string; // Formato: "YYYY-MM" (mes del registro, se guarda como 'fecha' en la BD)
    // Productos Perro
    pollo: number;
    vaca: number;
    cerdo: number;
    cordero: number;
    bigDogPollo: number;
    bigDogVaca: number;
    totalPerro: number;
    // Productos Gato
    gatoPollo: number;
    gatoVaca: number;
    gatoCordero: number;
    totalGato: number;
    // Otros
    huesosCarnosos: number;
    // Total del mes
    totalMes: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateDetalleEnvioData {
    puntoEnvio: string; // Nombre del punto de envío
    fecha: string; // Formato: "YYYY-MM"
    pollo?: number;
    vaca?: number;
    cerdo?: number;
    cordero?: number;
    bigDogPollo?: number;
    bigDogVaca?: number;
    totalPerro?: number;
    gatoPollo?: number;
    gatoVaca?: number;
    gatoCordero?: number;
    totalGato?: number;
    huesosCarnosos?: number;
    totalMes?: number;
}

export interface UpdateDetalleEnvioData {
    puntoEnvio?: string;
    fecha?: string; // Formato: "YYYY-MM"
    month?: string; // Deprecated: usar 'fecha' en su lugar
    pollo?: number;
    vaca?: number;
    cerdo?: number;
    cordero?: number;
    bigDogPollo?: number;
    bigDogVaca?: number;
    totalPerro?: number;
    gatoPollo?: number;
    gatoVaca?: number;
    gatoCordero?: number;
    totalGato?: number;
    huesosCarnosos?: number;
    totalMes?: number;
}

// ===== STOCK =====
export interface Stock {
    _id: string | ObjectId;
    puntoEnvio: string; // Nombre del punto de envío (conecta con DeliveryArea.puntoEnvio y Order.puntoEnvio)
    producto: string; // Nombre del producto
    peso?: string; // Peso del producto (ej: "5KG", "10KG")
    stockInicial: number; // Stock inicial del día
    llevamos: number; // Cantidad que llevamos/vendimos
    pedidosDelDia: number; // Pedidos del día
    stockFinal: number; // Stock final calculado (stockInicial - llevamos)
    fecha: string; // Fecha del registro de stock
    createdAt: string;
    updatedAt: string;
}

export interface CreateStockData {
    puntoEnvio: string; // Nombre del punto de envío
    producto: string;
    peso?: string;
    stockInicial: number;
    llevamos: number;
    pedidosDelDia: number;
    stockFinal?: number; // Si no se proporciona, se calcula como stockInicial - llevamos
    fecha?: string; // Si no se proporciona, usa la fecha actual
}

export interface UpdateStockData {
    puntoEnvio?: string;
    producto?: string;
    peso?: string;
    stockInicial?: number;
    llevamos?: number;
    pedidosDelDia?: number;
    stockFinal?: number;
    fecha?: string;
}

// ===== PUNTO DE ENVÍO =====
export interface PuntoEnvio {
    _id: string | ObjectId;
    nombre: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePuntoEnvioData {
    nombre: string;
}

export interface UpdatePuntoEnvioData {
    nombre?: string;
} 