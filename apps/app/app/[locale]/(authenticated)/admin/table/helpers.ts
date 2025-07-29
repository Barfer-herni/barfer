import { AVAILABLE_PRODUCTS, RAW_PRODUCTS, COMPLEMENT_PRODUCTS, FORBIDDEN_PRODUCTS_FOR_RETAIL, DAY_COLORS } from './constants';

// Función para obtener productos según el tipo de cliente
export const getProductsByClientType = (clientType: 'minorista' | 'mayorista') => {
    if (clientType === 'mayorista') {
        // Combinar todas las listas y eliminar duplicados
        const allProducts = [...AVAILABLE_PRODUCTS, ...RAW_PRODUCTS, ...COMPLEMENT_PRODUCTS];
        const uniqueProducts = [...new Set(allProducts)];
        return uniqueProducts;
    }
    // Excluir productos prohibidos para minorista
    const allProducts = [...AVAILABLE_PRODUCTS, ...RAW_PRODUCTS, ...COMPLEMENT_PRODUCTS];
    const filtered = allProducts.filter(product =>
        !FORBIDDEN_PRODUCTS_FOR_RETAIL.some(f => product.trim().toLowerCase().startsWith(f.toLowerCase()))
    );
    // Eliminar duplicados
    return [...new Set(filtered)];
};

// Función para filtrar productos por búsqueda
export const getFilteredProducts = (clientType: 'minorista' | 'mayorista', searchTerm: string) => {
    const products = getProductsByClientType(clientType);
    if (!searchTerm) return products;

    return products.filter(product =>
        product.toLowerCase().includes(searchTerm.toLowerCase())
    );
};

// Función para determinar el color de la fila
export const shouldHighlightRow = (row: any) => {
    const status = row.original.status?.toLowerCase();
    if (status === 'delivered') return 'green';
    return null;
};

// Función para determinar el color de fondo de la celda de fecha
export const getDateCellBackgroundColor = (deliveryDay: string | Date | { $date: string }) => {
    if (!deliveryDay) return '';

    // Usar la función helper para crear una fecha local
    const date = createLocalDate(deliveryDay);
    const day = date.getDay();
    return DAY_COLORS[day as keyof typeof DAY_COLORS] || '';
};

// Función para determinar el color de fondo de la celda de estado
export const getStatusCellBackgroundColor = (status: string, paymentMethod: string) => {
    if (status === 'pending' && paymentMethod !== 'cash') {
        return 'bg-red-500';
    }
    return '';
};

// Función para crear el objeto de orden por defecto
export const createDefaultOrderData = () => ({
    status: 'pending',
    total: 0,
    subTotal: 0,
    shippingPrice: 0,
    notes: '',
    notesOwn: '',
    paymentMethod: '',
    orderType: 'minorista' as 'minorista' | 'mayorista',
    address: {
        address: '',
        city: '',
        phone: '',
        betweenStreets: '',
        floorNumber: '',
        departmentNumber: '',
    },
    user: {
        name: '',
        lastName: '',
        email: '',
    },
    items: [{
        id: '',
        name: '',
        description: '',
        images: [],
        options: [{
            name: 'Default',
            price: 0,
            quantity: 1,
        }],
        price: 0,
        salesCount: 0,
        discountApllied: 0,
    }],
    deliveryArea: {
        _id: '',
        description: '',
        coordinates: [],
        schedule: '',
        orderCutOffHour: 18,
        enabled: true,
        sameDayDelivery: false,
        sameDayDeliveryDays: [],
        whatsappNumber: '',
        sheetName: '',
    },
    deliveryDay: '',
});

// Función para filtrar items válidos
export const filterValidItems = (items: any[]) => {
    return items?.filter((item: any) => {
        const hasName = item.name && item.name.trim() !== '';
        const hasQuantity = item.options?.[0]?.quantity > 0;
        return hasName && hasQuantity;
    }) || [];
};

// Función para validar entrada del campo de búsqueda
export const escapeRegex = (str: string) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Función para construir el nombre del archivo de exportación
export const buildExportFileName = (from?: string, to?: string) => {
    let fileName = 'ordenes';
    if (from && to) {
        if (from === to) {
            fileName = `ordenes-${from}`;
        } else {
            fileName = `ordenes-del-${from}-al-${to}`;
        }
    }
    return `${fileName}.xlsx`;
};

// Función para convertir base64 a blob
export const downloadBase64File = (base64Data: string, fileName: string) => {
    // Decodificar la cadena base64 a un array de bytes
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
};

// Función para crear una fecha local preservando la fecha original
export const createLocalDate = (dateInput: string | Date | { $date: string }): Date => {
    let date: Date;

    // Si es un objeto con $date, extraer el string
    if (typeof dateInput === 'object' && '$date' in dateInput) {
        date = new Date(dateInput.$date);
    }
    // Si ya es un Date, usar directamente
    else if (dateInput && typeof dateInput === 'object' && 'getTime' in dateInput) {
        date = dateInput as Date;
    } else if (typeof dateInput === 'string') {
        // Si es string, parsear
        date = new Date(dateInput);
    } else {
        // Fallback
        date = new Date(dateInput as any);
    }

    // Sumar 5 horas para ajustar a Argentina (UTC-3)
    const adjustedDate = new Date(date.getTime() + (5 * 60 * 60 * 1000));

    // Crear fecha local preservando solo año, mes y día
    return new Date(adjustedDate.getFullYear(), adjustedDate.getMonth(), adjustedDate.getDate());
};

// Función para crear una fecha ISO preservando la fecha local
export const createLocalDateISO = (date: Date): Date => {
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    return localDate;
}; 