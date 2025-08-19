import type { Order } from '@repo/data-services/src/types/barfer';

// Traducciones de estado
export const STATUS_TRANSLATIONS: Record<Order['status'], string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
};

// Traducciones de métodos de pago
export const PAYMENT_METHOD_TRANSLATIONS: Record<string, string> = {
    cash: 'Efectivo',
    transfer: 'Transferencia',
    'bank-transfer': 'Transferencia Bancaria',
    'mercado-pago': 'Mercado Pago',
};

// Productos disponibles para minoristas
export const AVAILABLE_PRODUCTS = [
    'Barfer box Gato Vaca 5kg',
    'Barfer box Perro Pollo 5kg',
    'Barfer box Perro Pollo 10kg',
    'Barfer box Perro Cerdo 5kg',
    'Barfer box Perro Cerdo 10kg',
    'Barfer box Gato Pollo 5kg',
    'Barfer box Gato Cordero 5kg',
    'Barfer box Perro Vaca 5kg',
    'Barfer box Perro Vaca 10kg',
    'Barfer box Perro Cordero 5kg',
    'Barfer box Perro Cordero 10kg',
    'BIG DOG (15kg) - POLLO',
    'BIG DOG (15kg) - VACA',
    'HUESOS CARNOSOS - 5KG',
    'Box de Complementos - 1 U',
];

// Productos Raw para mayoristas
export const RAW_PRODUCTS = [
    'Traquea X1',
    'Traquea X2',
    'Orejas',
    'Pollo 40grs',
    'Pollo 100grs',
    'Higado 40grs',
    'Higado 100grs',
    'Cornalitos 30grs',
    'Orejas'
];

// Productos complementos sueltos para mayoristas
export const COMPLEMENT_PRODUCTS = [
    'Cornalitos 200grs',
    'Caldo de huesos',
    'Hueso recreativo',
    'Garras 300grs'
];

// Productos prohibidos para minoristas
export const FORBIDDEN_PRODUCTS_FOR_RETAIL = ['Cornalitos', 'Orejas'];

// Anchos de columnas
export const COLUMN_WIDTHS = {
    checkbox: 32,
    orderType: 80,
    date: 70,
    schedule: 100,
    notesOwn: 110,
    client: 130,
    address: 180,
    phone: 100,
    items: 170,
    paymentMethod: 100,
    status: 85,
    total: 100,
    notes: 200,
    email: 80,
    actions: 80,
};

// Colores por día de la semana
export const DAY_COLORS = {
    1: 'bg-green-100', // Lunes
    2: 'bg-yellow-100', // Martes
    3: 'bg-red-100', // Miércoles
    4: 'bg-yellow-600', // Jueves
    6: 'bg-blue-100', // Sábado
};

// Opciones de estado
export const STATUS_OPTIONS = [
    { value: 'pending', label: 'Pendiente' },
    { value: 'confirmed', label: 'Confirmado' },
    { value: 'delivered', label: 'Entregado' },
    { value: 'cancelled', label: 'Cancelado' },
];

// Opciones de método de pago
export const PAYMENT_METHOD_OPTIONS = [
    { value: '', label: 'Seleccionar' },
    { value: 'cash', label: 'Efectivo' },
    { value: 'transfer', label: 'Transferencia' },
    { value: 'bank-transfer', label: 'Transferencia Bancaria' },
    { value: 'mercado-pago', label: 'Mercado Pago' },
];

// Opciones de tipo de cliente
export const ORDER_TYPE_OPTIONS = [
    { value: 'minorista', label: 'Minorista' },
    { value: 'mayorista', label: 'Mayorista' },
]; 