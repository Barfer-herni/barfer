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
    total: '',
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
        fullName: '',
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

// Función para extraer el peso del nombre del producto
export const extractWeightFromProductName = (productName: string): string => {
    if (!productName) return 'Default';

    // Patrones que NO son peso (productos que no necesitan extracción)
    const nonWeightPatterns = [
        /\b\d+\s*x\s*\d+\b/i,        // "traquea x1", "producto x2", etc.
        /\b\d+\s*U\b/i,               // "1 U", "2 U", etc.
        /\b\d+\s*unidades?\b/i,       // "1 unidad", "2 unidades", etc.
        /\b\d+\s*pcs?\b/i,            // "1 pc", "2 pcs", etc.
        /\b\d+\s*piezas?\b/i,         // "1 pieza", "2 piezas", etc.
        /\b\d+\s*capsulas?\b/i,       // "1 capsula", "2 capsulas", etc.
        /\b\d+\s*tabletas?\b/i,       // "1 tableta", "2 tabletas", etc.
        /\b\d+\s*comprimidos?\b/i,    // "1 comprimido", "2 comprimidos", etc.
    ];

    // Si el producto coincide con patrones que NO son peso, devolver el valor original
    for (const pattern of nonWeightPatterns) {
        if (pattern.test(productName)) {
            console.log(`🚫 Producto "${productName}" no necesita extracción de peso`);
            return 'Default';
        }
    }

    // Buscar patrones de peso al final del nombre
    const weightPatterns = [
        /\b(\d+)\s*kg\b/i,           // 10kg, 5 kg, etc.
        /\b(\d+)\s*KG\b/,            // 10KG, 5 KG, etc.
        /\b(\d+)\s*Kg\b/,            // 10Kg, 5 Kg, etc.
        /\b(\d+)\s*gramos?\b/i,      // 500 gramos, 500 gramo, etc.
        /\b(\d+)\s*g\b/i,            // 500g, 500 g, etc.
        /\b(\d+)\s*G\b/,             // 500G, 500 G, etc.
        /\b(\d+)\s*litros?\b/i,      // 1 litro, 1 litros, etc.
        /\b(\d+)\s*l\b/i,            // 1l, 1 l, etc.
        /\b(\d+)\s*L\b/,             // 1L, 1 L, etc.
    ];

    for (const pattern of weightPatterns) {
        const match = productName.match(pattern);
        if (match) {
            const weight = match[1];
            const unit = match[0].replace(weight, '').trim();

            // Normalizar la unidad
            if (unit.toLowerCase().includes('kg') || unit.toLowerCase().includes('kilo')) {
                return `${weight}KG`;
            } else if (unit.toLowerCase().includes('gramo') || unit.toLowerCase().includes('g')) {
                return `${weight}G`;
            } else if (unit.toLowerCase().includes('litro') || unit.toLowerCase().includes('l')) {
                return `${weight}L`;
            }

            // Si no se reconoce la unidad, devolver el valor encontrado
            return match[0].toUpperCase();
        }
    }

    // Si no se encuentra peso, buscar en patrones específicos conocidos
    const knownPatterns = [
        { pattern: /\bBIG DOG\b.*?\((\d+)\s*kg\)/i, unit: 'KG' },
        { pattern: /\b(\d+)\s*medallones?\s*de\s*(\d+)\s*g/i, unit: 'G' },
    ];

    for (const { pattern, unit } of knownPatterns) {
        const match = productName.match(pattern);
        if (match) {
            if (unit === 'G' && match[2]) {
                // Para medallones, calcular el peso total
                const medallones = parseInt(match[1]);
                const pesoMedallon = parseInt(match[2]);
                const pesoTotal = medallones * pesoMedallon;
                return `${pesoTotal}G`;
            } else if (match[1]) {
                return `${match[1]}${unit}`;
            }
        }
    }

    // Si no se encuentra peso, devolver 'Default'
    return 'Default';
};

// Función para extraer el nombre base del producto (sin el peso)
export const extractBaseProductName = (productName: string): string => {
    if (!productName) return '';

    // Patrones que NO son peso (productos que no necesitan extracción)
    const nonWeightPatterns = [
        /\b\d+\s*x\s*\d+\b/i,        // "traquea x1", "producto x2", etc.
        /\b\d+\s*U\b/i,               // "1 U", "2 U", etc.
        /\b\d+\s*unidades?\b/i,       // "1 unidad", "2 unidades", etc.
        /\b\d+\s*pcs?\b/i,            // "1 pc", "2 pcs", etc.
        /\b\d+\s*piezas?\b/i,         // "1 pieza", "2 piezas", etc.
        /\b\d+\s*capsulas?\b/i,       // "1 capsula", "2 capsulas", etc.
        /\b\d+\s*tabletas?\b/i,       // "1 tableta", "2 tabletas", etc.
        /\b\d+\s*comprimidos?\b/i,    // "1 comprimido", "2 comprimidos", etc.
    ];

    // Si el producto coincide con patrones que NO son peso, devolver el nombre original
    for (const pattern of nonWeightPatterns) {
        if (pattern.test(productName)) {
            console.log(`🚫 Producto "${productName}" mantiene su nombre original`);
            return productName;
        }
    }

    // Buscar patrones de peso al final del nombre y removerlos
    const weightPatterns = [
        /\s+\d+\s*kg\b/i,           // 10kg, 5 kg, etc.
        /\s+\d+\s*KG\b/,            // 10KG, 5 KG, etc.
        /\s+\d+\s*Kg\b/,            // 10Kg, 5 Kg, etc.
        /\s+\d+\s*gramos?\b/i,      // 500 gramos, 500 gramo, etc.
        /\s+\d+\s*g\b/i,            // 500g, 500 g, etc.
        /\s+\d+\s*G\b/,             // 500G, 500 G, etc.
        /\s+\d+\s*litros?\b/i,      // 1 litro, 1 litros, etc.
        /\s+\d+\s*l\b/i,            // 1l, 1 l, etc.
        /\s+\d+\s*L\b/,             // 1L, 1 L, etc.
    ];

    let baseName = productName;

    // Remover patrones de peso encontrados
    for (const pattern of weightPatterns) {
        baseName = baseName.replace(pattern, '');
    }

    // Remover patrones específicos conocidos
    const specificPatterns = [
        /\s*\([^)]*\)/g,            // Remover paréntesis y su contenido
        /\s*-\s*[^-]*$/g,           // Remover guiones y contenido después del último guión
    ];

    for (const pattern of specificPatterns) {
        baseName = baseName.replace(pattern, '');
    }

    // Limpiar espacios extra y retornar
    return baseName.trim();
};

// Función para filtrar items válidos
export const filterValidItems = (items: any[]) => {
    console.log('🔍 filterValidItems - Items recibidos:', items);

    return items.filter(item => {
        // Verificar que el item tenga nombre y cantidad válida
        const hasValidName = item.name && item.name.trim() !== '';
        const hasValidQuantity = item.options?.[0]?.quantity > 0;

        console.log(`📦 Item "${item.name}":`, {
            hasValidName,
            hasValidQuantity,
            currentOptionName: item.options?.[0]?.name
        });

        if (hasValidName && hasValidQuantity) {
            // Si no tenemos fullName, usar el nombre actual
            const originalName = item.fullName || item.name;

            // Extraer el peso del nombre del producto y asignarlo a la opción
            const weight = extractWeightFromProductName(originalName);
            // Extraer el nombre base del producto (sin peso)
            const baseName = extractBaseProductName(originalName);

            console.log(`⚖️ Peso extraído de "${originalName}": ${weight}`);
            console.log(`🏷️ Nombre base extraído: "${baseName}"`);

            if (item.options && item.options[0]) {
                item.options[0].name = weight;
                console.log(`✅ Opción actualizada: ${weight}`);
            }

            // Actualizar el nombre del item con el nombre base (sin peso)
            item.name = baseName;
            // Preservar el nombre completo para el select
            item.fullName = originalName;
            console.log(`✅ Nombre del item actualizado: "${baseName}"`);
            console.log(`✅ Nombre completo preservado: "${originalName}"`);
        }

        return hasValidName && hasValidQuantity;
    });
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