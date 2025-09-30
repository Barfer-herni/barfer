/**
 * Utilidades para mapear productos del select al formato de la base de datos
 */

export interface ProductMapping {
    name: string;
    option: string;
}

/**
 * Mapea una opción del select hacia el formato de la base de datos
 * @param selectOption - El texto completo del select (ej: "Barfer box Perro Cerdo 10kg")
 * @returns Objeto con el nombre y opción en formato DB
 */
export function mapSelectOptionToDBFormat(selectOption: string): ProductMapping {
    const normalizedSelect = selectOption.toLowerCase().trim();

    // Debug específico para CORNALITOS
    if (normalizedSelect.includes('cornalitos')) {
        console.log(`🌽 DEBUG MAPEO CORNALITOS (productMapping):`, {
            original: selectOption,
            normalized: normalizedSelect,
            contains30grs: normalizedSelect.includes('30grs'),
            contains200grs: normalizedSelect.includes('200grs')
        });
    }

    // Mapear productos GATO directamente (sin BOX)
    if (normalizedSelect.includes('gato') && !normalizedSelect.includes('barfer box')) {
        if (normalizedSelect.includes('vaca')) {
            if (normalizedSelect.includes('5kg')) {
                return { name: 'BOX GATO VACA', option: '5KG' };
            }
        }
        if (normalizedSelect.includes('pollo')) {
            if (normalizedSelect.includes('5kg')) {
                return { name: 'BOX GATO POLLO', option: '5KG' };
            }
        }
        if (normalizedSelect.includes('cordero')) {
            if (normalizedSelect.includes('5kg')) {
                return { name: 'BOX GATO CORDERO', option: '5KG' };
            }
        }
    }

    // Mapear productos PERRO directamente (sin BOX)
    if (normalizedSelect.includes('perro') && !normalizedSelect.includes('barfer box') && !normalizedSelect.includes('gato')) {
        if (normalizedSelect.includes('vaca')) {
            if (normalizedSelect.includes('5kg')) {
                return { name: 'BOX PERRO VACA', option: '5KG' };
            }
            if (normalizedSelect.includes('10kg')) {
                return { name: 'BOX PERRO VACA', option: '10KG' };
            }
        }
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
        if (normalizedSelect.includes('cordero')) {
            if (normalizedSelect.includes('5kg')) {
                return { name: 'BOX PERRO CORDERO', option: '5KG' };
            }
            if (normalizedSelect.includes('10kg')) {
                return { name: 'BOX PERRO CORDERO', option: '10KG' };
            }
        }
    }

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

    // Mapear complementos - IMPORTANTE: debe ir ANTES que huesos para evitar conflictos
    if (normalizedSelect.includes('caldo')) {
        return { name: 'CALDO DE HUESOS', option: '' };
    }

    // Mapear HUESO RECREATIVO - IMPORTANTE: debe ir ANTES que la verificación genérica de huesos
    if (normalizedSelect.includes('hueso recreativo') || normalizedSelect.includes('huesos recreativos')) {
        return { name: 'HUESOS RECREATIVOS', option: '' };
    }

    // Mapear Huesos Carnosos (pero no si es caldo de huesos o hueso recreativo)
    if (normalizedSelect.includes('huesos') && !normalizedSelect.includes('caldo') && !normalizedSelect.includes('recreativo')) {
        return { name: 'HUESOS CARNOSOS', option: '5KG' };
    }

    // Mapear Complementos
    if (normalizedSelect.includes('complementos')) {
        return { name: 'BOX DE COMPLEMENTOS', option: '1 U' };
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
        if (normalizedSelect.includes('30grs') || normalizedSelect.includes('30 grs') || normalizedSelect.includes('30gr')) {
            return { name: 'CORNALITOS', option: '30GRS' };
        }
        if (normalizedSelect.includes('200grs') || normalizedSelect.includes('200 grs') || normalizedSelect.includes('200gr')) {
            return { name: 'CORNALITOS', option: '200GRS' };
        }
        // Si no se encuentra peso específico, devolver sin opción para debug
        console.warn(`⚠️ CORNALITOS sin peso específico detectado: "${selectOption}"`);
        return { name: 'CORNALITOS', option: '' };
    }

    if (normalizedSelect.includes('garras')) {
        if (normalizedSelect.includes('300grs')) {
            return { name: 'GARRAS', option: '300GRS' };
        }
    }

    // Si no se encuentra mapeo, devolver el nombre original
    console.warn(`No se encontró mapeo inverso para: ${selectOption}`);
    return { name: selectOption.toUpperCase(), option: '' };
}

/**
 * Procesa los items de una orden para convertir nombres del select al formato de la DB
 * @param items - Array de items de la orden
 * @returns Array de items procesados
 */
export function processOrderItems(items: any[]): any[] {
    if (!items || !Array.isArray(items)) {
        return items;
    }

    return items.map((item: any, index: number) => {
        // Si el item tiene fullName (texto del select), convertirlo al formato de la DB
        let itemName = item.name;
        let itemId = item.id;
        let itemOptions = item.options || [];

        // Verificar si el name es un texto del select (contiene "barfer box", "big dog", etc.)
        const isSelectText = item.name && (
            item.name.toLowerCase().includes('barfer box') ||
            item.name.toLowerCase().includes('big dog') ||
            item.name.toLowerCase().includes('huesos') ||
            item.name.toLowerCase().includes('traquea') ||
            item.name.toLowerCase().includes('orejas') ||
            item.name.toLowerCase().includes('pollo') ||
            item.name.toLowerCase().includes('fullName') ||
            item.name.toLowerCase().includes('cornalitos') ||
            item.name.toLowerCase().includes('caldo') ||
            item.name.toLowerCase().includes('hueso recreativo') ||
            item.name.toLowerCase().includes('garras') ||
            item.name.toLowerCase().includes('complementos')
        );

        if (item.fullName && item.fullName !== item.name) {
            // El fullName es diferente al name, significa que viene del select
            const dbFormat = mapSelectOptionToDBFormat(item.fullName);
            itemName = dbFormat.name;
            itemId = dbFormat.name; // El ID debe ser el mismo que el name en formato DB

            // Actualizar la primera opción con el peso correcto
            if (itemOptions.length > 0 && dbFormat.option) {
                itemOptions[0] = {
                    ...itemOptions[0],
                    name: dbFormat.option
                };
            }
        } else if (isSelectText) {
            // El name es un texto del select, convertirlo al formato de la DB
            const dbFormat = mapSelectOptionToDBFormat(item.name);
            itemName = dbFormat.name;
            itemId = dbFormat.name; // El ID debe ser el mismo que el name en formato DB

            // Actualizar la primera opción con el peso correcto
            if (itemOptions.length > 0 && dbFormat.option) {
                itemOptions[0] = {
                    ...itemOptions[0],
                    name: dbFormat.option
                };
            }
        }

        // Crear un nuevo objeto solo con los campos necesarios para la DB
        const cleanItem = {
            id: itemId,
            name: itemName,
            description: item.description || '',
            images: item.images || [],
            options: itemOptions,
            price: item.price || 0,
            salesCount: item.salesCount || 0,
            discountApllied: item.discountApllied || 0
        };

        // Asegurar que options tenga la estructura correcta
        if (cleanItem.options && Array.isArray(cleanItem.options)) {
            cleanItem.options = cleanItem.options.map((option: any) => ({
                name: option.name || '',
                price: option.price || 0,
                quantity: option.quantity || 1
            }));
        }

        return cleanItem;
    });
}
