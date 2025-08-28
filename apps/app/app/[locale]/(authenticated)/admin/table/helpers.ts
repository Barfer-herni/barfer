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
    total: '', // Campo vacío para forzar al usuario a ingresar un valor
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
        { pattern: /\bBIG DOG\b.*?\((\d+)\s*kg\)/i, unit: 'kg' },
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
    ];

    // Si el producto coincide con patrones que NO son peso, devolver el nombre original
    for (const pattern of nonWeightPatterns) {
        if (pattern.test(productName)) {
            console.log(`🚫 Producto "${productName}" mantiene su nombre original`);
            return productName;
        }
    }

    let baseName = productName;

    // NORMALIZACIÓN: Convertir nombres "Barfer box Perro Pollo 5kg" a "BOX PERRO POLLO"
    // Patrón para productos Barfer
    const barferPattern = /^barfer\s+box\s+(.+?)(?:\s+\d+\s*kg|\s*$)/i;
    const barferMatch = baseName.match(barferPattern);

    if (barferMatch) {
        // Extraer la parte después de "barfer box" y convertir a formato estándar
        const productType = barferMatch[1].trim();
        const words = productType.split(' ').map(word => word.toUpperCase());
        baseName = `BOX ${words.join(' ')}`;
        console.log(`🔄 Normalizando producto Barfer: "${productName}" → "${baseName}"`);
        return baseName;
    }

    // NORMALIZACIÓN: Convertir nombres "BIG DOG (15kg) - POLLO" a "BIG DOG POLLO"
    const bigDogPattern = /^big\s+dog\s*\([^)]*\)\s*-\s*(.+?)$/i;
    const bigDogMatch = baseName.match(bigDogPattern);

    if (bigDogMatch) {
        const variant = bigDogMatch[1].trim().toUpperCase();
        baseName = `BIG DOG ${variant}`;
        console.log(`🔄 Normalizando producto Big Dog: "${productName}" → "${baseName}"`);
        return baseName;
    }

    // NORMALIZACIÓN: Para productos que ya están en formato "BOX PERRO POLLO 5KG", remover solo el peso
    // Buscar patrones de peso al final del nombre y removerlos
    const weightPatterns = [
        /\s+\d+\s*kg\b/i,           // 10kg, 5 kg, etc.
        /\s+\d+\s*KG\b/,            // 10KG, 5 KG, etc.
        /\s+\d+\s*Kg\b/,            // 10Kg, 5 Kg, etc.
        /\s+\d+\s*U\b/i,            // 1U, 2 U, etc.
        /\s+\d+\s*gramos?\b/i,      // 500 gramos, 500 gramo, etc.
        /\s+\d+\s*g\b/i,            // 500g, 500 g, etc.
        /\s+\d+\s*G\b/,             // 500G, 500 G, etc.
        /\s+\d+\s*litros?\b/i,      // 1 litro, 1 litros, etc.
        /\s+\d+\s*l\b/i,            // 1l, 1 l, etc.
        /\s+\d+\s*L\b/,             // 1L, 1 L, etc.
    ];

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

    // Normalizar a mayúsculas si es un producto BOX o BIG DOG
    if (baseName.toUpperCase().startsWith('BOX ') || baseName.toUpperCase().startsWith('BIG DOG')) {
        baseName = baseName.toUpperCase();
    }

    // Limpiar espacios extra y retornar
    return baseName.trim();
};

// Función para procesar un solo item (extraer peso y nombre base)
export const processSingleItem = (item: any): any => {
    if (!item.name || !item.name.trim()) return item;

    // Si ya tiene fullName y options.name no es 'Default', no procesar
    if (item.fullName && item.options?.[0]?.name && item.options[0].name !== 'Default') {
        console.log(`🔄 Item "${item.name}" ya procesado, saltando...`);
        return item;
    }

    // Si no tenemos fullName, usar el nombre actual
    const originalName = item.fullName || item.name;

    // Si el nombre parece ser una opción del select (contiene "barfer box", "big dog", etc.)
    // usar el mapeo inverso para obtener el formato de la DB
    if (originalName.toLowerCase().includes('barfer box') ||
        originalName.toLowerCase().includes('big dog') ||
        originalName.toLowerCase().includes('huesos') ||
        originalName.toLowerCase().includes('traquea') ||
        originalName.toLowerCase().includes('orejas') ||
        originalName.toLowerCase().includes('pollo') ||
        originalName.toLowerCase().includes('higado') ||
        originalName.toLowerCase().includes('cornalitos') ||
        originalName.toLowerCase().includes('caldo') ||
        originalName.toLowerCase().includes('hueso recreativo') ||
        originalName.toLowerCase().includes('garras') ||
        originalName.toLowerCase().includes('complementos')) {

        console.log(`🔄 Detectado nombre de select, aplicando mapeo inverso: "${originalName}"`);
        const dbFormat = mapSelectOptionToDBFormat(originalName);

        return {
            ...item,
            id: dbFormat.name,
            name: dbFormat.name,
            fullName: originalName,
            options: [{
                ...item.options?.[0],
                name: dbFormat.option
            }]
        };
    }

    // Si no es un nombre de select, usar el procesamiento original
    // Extraer el peso del nombre del producto y asignarlo a la opción
    const weight = extractWeightFromProductName(originalName);
    // Extraer el nombre base del producto (sin peso)
    const baseName = extractBaseProductName(originalName);

    console.log(`⚖️ Procesando item "${originalName}":`);
    console.log(`  → Peso extraído: ${weight}`);
    console.log(`  → Nombre base: "${baseName}"`);

    // Crear una copia del item para no modificar el original
    const processedItem = {
        ...item,
        id: baseName,        // ID también debe ser el nombre base (sin peso)
        name: baseName,      // Nombre base (sin peso)
        fullName: originalName, // Nombre completo original para referencia
        options: [{
            ...item.options?.[0],
            name: weight     // Peso extraído (5KG, 10KG, etc.)
        }]
    };

    console.log(`✅ Item procesado: "${baseName}" con opción "${weight}"`);
    return processedItem;
};

// Función para filtrar items válidos (solo valida, no procesa)
export const filterValidItems = (items: any[]) => {
    console.log('🔍 filterValidItems - Solo validando items, sin procesar');

    return items.filter(item => {
        // Verificar que el item tenga nombre y cantidad válida
        const hasValidName = item.name && item.name.trim() !== '';
        const hasValidQuantity = item.options?.[0]?.quantity > 0;

        console.log(`📦 Item "${item.name}":`, {
            hasValidName,
            hasValidQuantity,
            currentOptionName: item.options?.[0]?.name
        });

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

// Función para probar la normalización de nombres de productos
export const testProductNameNormalization = () => {
    const testCases = [
        'Barfer box Perro Pollo 5kg',
        'Barfer box Gato Vaca 5kg',
        'Barfer box Perro Cerdo 10kg',
        'BIG DOG (15kg) - POLLO',
        'BIG DOG (15kg) - VACA',
        'BOX PERRO POLLO 5KG',
        'BOX GATO CORDERO 5KG',
        'BOX PERRO POLLO 10KG',
        'HUESOS CARNOSOS 5KG',
        'BOX COMPLEMENTOS 1U'
    ];

    console.log('🧪 Probando normalización de nombres de productos:');
    testCases.forEach(testCase => {
        const normalized = extractBaseProductName(testCase);
        const weight = extractWeightFromProductName(testCase);
        console.log(`  "${testCase}" → nombre: "${normalized}", peso: "${weight}"`);
    });
};

// Función para probar el procesamiento completo de items
export const testItemProcessing = () => {
    const testItems = [
        {
            name: 'BOX PERRO POLLO 10KG',
            options: [{ name: 'Default', price: 0, quantity: 1 }]
        },
        {
            name: 'Barfer box Gato Vaca 5kg',
            options: [{ name: 'Default', price: 0, quantity: 2 }]
        }
    ];

    console.log('🧪 Probando procesamiento completo de items:');
    testItems.forEach((item, index) => {
        console.log(`\n📦 Item ${index + 1} original:`, item);
        const processed = processSingleItem(item);
        console.log(`✅ Item ${index + 1} procesado:`, {
            id: processed.id,
            name: processed.name,
            fullName: processed.fullName,
            options: processed.options
        });
    });
};

// Función para mapear productos de la DB hacia las opciones del select
export const mapDBProductToSelectOption = (dbProductName: string, dbOptionName: string): string => {
    // Normalizar nombres para comparación
    const normalizedDBName = dbProductName.toLowerCase().trim();
    const normalizedDBOption = dbOptionName.toLowerCase().trim();

    // Caso especial para BIG DOG
    if (normalizedDBName.includes('big dog')) {
        // El sabor está en dbOptionName (ej: "VACA", "POLLO")
        const flavor = dbOptionName.toUpperCase();
        return `BIG DOG (15kg) - ${flavor}`;
    }

    // Buscar en AVAILABLE_PRODUCTS primero
    for (const product of AVAILABLE_PRODUCTS) {
        const normalizedProduct = product.toLowerCase();

        // Verificar si el producto base coincide
        if (normalizedProduct.includes('barfer box') &&
            (normalizedDBName.includes('box') || normalizedDBName.includes('perro') || normalizedDBName.includes('gato'))) {

            // Extraer el tipo de animal y proteína
            if (normalizedDBName.includes('perro') && normalizedProduct.includes('perro')) {
                if (normalizedDBName.includes('pollo') && normalizedProduct.includes('pollo')) {
                    // Buscar por peso
                    if (normalizedDBOption.includes('5kg') && normalizedProduct.includes('5kg')) {
                        return product;
                    }
                    if (normalizedDBOption.includes('10kg') && normalizedProduct.includes('10kg')) {
                        return product;
                    }
                }
                if (normalizedDBName.includes('cerdo') && normalizedProduct.includes('cerdo')) {
                    if (normalizedDBOption.includes('5kg') && normalizedProduct.includes('5kg')) {
                        return product;
                    }
                    if (normalizedDBOption.includes('10kg') && normalizedProduct.includes('10kg')) {
                        return product;
                    }
                }
                if (normalizedDBName.includes('vaca') && normalizedProduct.includes('vaca')) {
                    if (normalizedDBOption.includes('5kg') && normalizedProduct.includes('5kg')) {
                        return product;
                    }
                    if (normalizedDBOption.includes('10kg') && normalizedProduct.includes('10kg')) {
                        return product;
                    }
                }
                if (normalizedDBName.includes('cordero') && normalizedProduct.includes('cordero')) {
                    if (normalizedDBOption.includes('5kg') && normalizedProduct.includes('5kg')) {
                        return product;
                    }
                    if (normalizedDBOption.includes('10kg') && normalizedProduct.includes('10kg')) {
                        return product;
                    }
                }
            }

            if (normalizedDBName.includes('gato') && normalizedProduct.includes('gato')) {
                if (normalizedDBName.includes('pollo') && normalizedProduct.includes('pollo')) {
                    if (normalizedDBOption.includes('5kg') && normalizedProduct.includes('5kg')) {
                        return product;
                    }
                }
                if (normalizedDBName.includes('vaca') && normalizedProduct.includes('vaca')) {
                    if (normalizedDBOption.includes('5kg') && normalizedProduct.includes('5kg')) {
                        return product;
                    }
                }
                if (normalizedDBName.includes('cordero') && normalizedProduct.includes('cordero')) {
                    if (normalizedDBOption.includes('5kg') && normalizedProduct.includes('5kg')) {
                        return product;
                    }
                }
            }
        }

        // Casos especiales
        if (normalizedDBName.includes('huesos') && normalizedProduct.includes('huesos')) {
            if (normalizedDBOption.includes('5kg') && normalizedProduct.includes('5kg')) {
                return product;
            }
        }

        if (normalizedDBName.includes('complementos') && normalizedProduct.includes('complementos')) {
            return product;
        }
    }

    // Buscar en RAW_PRODUCTS
    for (const product of RAW_PRODUCTS) {
        const normalizedProduct = product.toLowerCase();

        if (normalizedDBName.includes('traquea') && normalizedProduct.includes('traquea')) {
            if (normalizedDBOption.includes('x1') && normalizedProduct.includes('x1')) {
                return product;
            }
            if (normalizedDBOption.includes('x2') && normalizedProduct.includes('x2')) {
                return product;
            }
        }

        if (normalizedDBName.includes('orejas') && normalizedProduct.includes('orejas')) {
            return product;
        }

        if (normalizedDBName.includes('pollo') && normalizedProduct.includes('pollo')) {
            if (normalizedDBOption.includes('40grs') && normalizedProduct.includes('40grs')) {
                return product;
            }
            if (normalizedDBOption.includes('100grs') && normalizedProduct.includes('100grs')) {
                return product;
            }
        }

        if (normalizedDBName.includes('higado') && normalizedProduct.includes('higado')) {
            if (normalizedDBOption.includes('40grs') && normalizedProduct.includes('40grs')) {
                return product;
            }
            if (normalizedDBOption.includes('100grs') && normalizedProduct.includes('100grs')) {
                return product;
            }
        }

        if (normalizedDBName.includes('cornalitos') && normalizedProduct.includes('cornalitos')) {
            if (normalizedDBOption.includes('30grs') && normalizedProduct.includes('30grs')) {
                return product;
            }
        }
    }

    // Buscar en COMPLEMENT_PRODUCTS
    for (const product of COMPLEMENT_PRODUCTS) {
        const normalizedProduct = product.toLowerCase();

        if (normalizedDBName.includes('cornalitos') && normalizedProduct.includes('cornalitos')) {
            if (normalizedDBOption.includes('200grs') && normalizedProduct.includes('200grs')) {
                return product;
            }
        }

        if (normalizedDBName.includes('caldo') && normalizedProduct.includes('caldo')) {
            return product;
        }

        if (normalizedDBName.includes('hueso') && normalizedProduct.includes('hueso')) {
            return product;
        }

        if (normalizedDBName.includes('garras') && normalizedProduct.includes('garras')) {
            if (normalizedDBOption.includes('300grs') && normalizedProduct.includes('300grs')) {
                return product;
            }
        }
    }

    // Si no se encuentra coincidencia, devolver el nombre original de la DB
    console.warn(`No se encontró mapeo para: ${dbProductName} - ${dbOptionName}`);
    return dbProductName;
};

// Función para mapear desde la opción del select hacia el formato de la DB
export const mapSelectOptionToDBFormat = (selectOption: string): { name: string, option: string } => {
    const normalizedSelect = selectOption.toLowerCase().trim();

    // Mapear Barfer Box
    if (normalizedSelect.includes('barfer box')) {
        if (normalizedSelect.includes('perro')) {
            if (normalizedSelect.includes('pollo')) {
                if (normalizedSelect.includes('5kg')) {
                    return { name: 'BOX PERRO POLLO', option: '5KG' };
                }
                if (normalizedSelect.includes('10kg')) {
                    return { name: 'BOX PERRO POLLO', option: '10KG' };
                }
            }
            if (normalizedSelect.includes('cerdo')) {
                if (normalizedSelect.includes('5kg')) {
                    return { name: 'BOX PERRO CERDO', option: '5KG' };
                }
                if (normalizedSelect.includes('10kg')) {
                    return { name: 'BOX PERRO CERDO', option: '10KG' };
                }
            }
            if (normalizedSelect.includes('vaca')) {
                if (normalizedSelect.includes('5kg')) {
                    return { name: 'BOX PERRO VACA', option: '5KG' };
                }
                if (normalizedSelect.includes('10kg')) {
                    return { name: 'BOX PERRO VACA', option: '10KG' };
                }
            }
            if (normalizedSelect.includes('cordero')) {
                if (normalizedSelect.includes('5kg')) {
                    return { name: 'BOX PERRO CORDERO', option: '5KG' };
                }
                if (normalizedSelect.includes('10kg')) {
                    return { name: 'BOX PERRO CORDERO', option: '10KG' };
                }
            }
        }

        if (normalizedSelect.includes('gato')) {
            if (normalizedSelect.includes('pollo')) {
                if (normalizedSelect.includes('5kg')) {
                    return { name: 'BOX GATO POLLO', option: '5KG' };
                }
            }
            if (normalizedSelect.includes('vaca')) {
                if (normalizedSelect.includes('5kg')) {
                    return { name: 'BOX GATO VACA', option: '5KG' };
                }
            }
            if (normalizedSelect.includes('cordero')) {
                if (normalizedSelect.includes('5kg')) {
                    return { name: 'BOX GATO CORDERO', option: '5KG' };
                }
            }
        }
    }

    // Mapear Big Dog
    if (normalizedSelect.includes('big dog')) {
        if (normalizedSelect.includes('pollo')) {
            return { name: 'BIG DOG (15kg)', option: 'POLLO' };
        }
        if (normalizedSelect.includes('vaca')) {
            return { name: 'BIG DOG (15kg)', option: 'VACA' };
        }
        if (normalizedSelect.includes('cordero')) {
            return { name: 'BIG DOG (15kg)', option: 'CORDERO' };
        }
    }

    // Mapear Huesos
    if (normalizedSelect.includes('huesos')) {
        return { name: 'HUESOS CARNOSOS', option: '5KG' };
    }

    // Mapear Complementos
    if (normalizedSelect.includes('complementos')) {
        return { name: 'COMPLEMENTOS', option: '1 U' };
    }

    // Mapear productos raw
    if (normalizedSelect.includes('traquea')) {
        if (normalizedSelect.includes('x1')) {
            return { name: 'TRAQUEA', option: 'X1' };
        }
        if (normalizedSelect.includes('x2')) {
            return { name: 'TRAQUEA', option: 'X2' };
        }
    }

    if (normalizedSelect.includes('orejas')) {
        return { name: 'OREJAS', option: '' };
    }

    if (normalizedSelect.includes('pollo')) {
        if (normalizedSelect.includes('40grs')) {
            return { name: 'POLLO', option: '40GRS' };
        }
        if (normalizedSelect.includes('100grs')) {
            return { name: 'POLLO', option: '100GRS' };
        }
    }

    if (normalizedSelect.includes('higado')) {
        if (normalizedSelect.includes('40grs')) {
            return { name: 'HIGADO', option: '40GRS' };
        }
        if (normalizedSelect.includes('100grs')) {
            return { name: 'HIGADO', option: '100GRS' };
        }
    }

    if (normalizedSelect.includes('cornalitos')) {
        if (normalizedSelect.includes('30grs')) {
            return { name: 'CORNALITOS', option: '30GRS' };
        }
        if (normalizedSelect.includes('200grs')) {
            return { name: 'CORNALITOS', option: '200GRS' };
        }
    }

    // Mapear complementos
    if (normalizedSelect.includes('caldo')) {
        return { name: 'CALDO DE HUESOS', option: '' };
    }

    if (normalizedSelect.includes('hueso recreativo')) {
        return { name: 'HUESO RECREATIVO', option: '' };
    }

    if (normalizedSelect.includes('garras')) {
        if (normalizedSelect.includes('300grs')) {
            return { name: 'GARRAS', option: '300GRS' };
        }
    }

    // Si no se encuentra mapeo, devolver el nombre original
    console.warn(`No se encontró mapeo inverso para: ${selectOption}`);
    return { name: selectOption.toUpperCase(), option: '' };
};

/**
 * Normaliza el formato de hora en el schedule, convirtiendo puntos (.) a dos puntos (:)
 * y mejorando el formato visual para que sea más legible
 * 
 * Ejemplos de conversión:
 * - "18.30" -> "18:30"
 * - "19.45" -> "19:45"
 * - "18.5" -> "18:05"
 * - "18.0" -> "18:00"
 * - "18hs" -> "18:00hs"
 * - "18 . 30" -> "18:30"
 * - "19 . 45" -> "19:45"
 * - "De 1830 a 2000hs aprox" -> "De 18:30 a 20:00hs aprox"
 * 
 * @param schedule - El string del schedule que puede contener horas con . o :
 * @returns El schedule normalizado con : en lugar de . y formato visual mejorado
 */
export const normalizeScheduleTime = (schedule: string): string => {
    if (!schedule) return schedule;

    // Evitar normalizar si ya está en formato correcto
    if (schedule.includes(':') && !schedule.includes('.')) {
        return schedule;
    }

    let normalized = schedule;

    // Primero: buscar patrones con espacios como "18 . 30", "19 . 45" y convertirlos
    normalized = normalized.replace(/(\d{1,2})\s*\.\s*(\d{1,2})/g, (match, hour, minute) => {
        const paddedMinute = minute.padStart(2, '0');
        return `${hour}:${paddedMinute}`;
    });

    // Segundo: buscar patrones de hora como "18.30", "19.45", "10.15", etc.
    // Solo si no fueron convertidos en el paso anterior
    normalized = normalized.replace(/(\d{1,2})\.(\d{1,2})/g, (match, hour, minute) => {
        // Asegurar que los minutos tengan 2 dígitos
        const paddedMinute = minute.padStart(2, '0');
        return `${hour}:${paddedMinute}`;
    });

    // Tercero: buscar patrones de solo hora como "18hs", "19hs" y convertirlos a "18:00hs", "19:00hs"
    // Solo si no tienen ya minutos
    normalized = normalized.replace(/(\d{1,2})(?<!:\d{2})hs/g, '$1:00hs');

    // Cuarto: buscar patrones de 4 dígitos consecutivos (como "1830", "2000") y convertirlos a formato de hora
    // Esto convierte "1830" a "18:30" y "2000" a "20:00"
    normalized = normalized.replace(/(\d{1,2})(\d{2})(?=\s|hs|$|a|aprox)/g, (match, hour, minute) => {
        // Solo convertir si los minutos son válidos (00-59)
        const minuteNum = parseInt(minute);
        if (minuteNum >= 0 && minuteNum <= 59) {
            return `${hour}:${minute}`;
        }
        return match; // Si no son minutos válidos, mantener como está
    });

    return normalized;
}; 