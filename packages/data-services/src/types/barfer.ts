// Tipos para la base de datos Barfer MongoDB

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