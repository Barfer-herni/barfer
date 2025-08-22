// Script simple para probar la lógica de mapeo
function mapSelectOptionToDBFormat(selectOption) {
    const normalizedSelect = selectOption.toLowerCase().trim();
    
    console.log('🔍 Normalized input:', normalizedSelect);
    
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
            return { name: 'BIG DOG POLLO', option: '15KG' };
        }
        if (normalizedSelect.includes('vaca')) {
            return { name: 'BIG DOG VACA', option: '15KG' };
        }
    }
    
    // Mapear otros productos
    if (normalizedSelect.includes('huesos')) {
        return { name: 'HUESOS CARNOSOS', option: '5KG' };
    }
    if (normalizedSelect.includes('complementos')) {
        return { name: 'COMPLEMENTOS', option: '1 U' };
    }
    
    // Si no se encuentra mapeo, devolver el nombre original
    console.warn(`No se encontró mapeo inverso para: ${selectOption}`);
    return { name: selectOption.toUpperCase(), option: '' };
}

// Probar el caso específico del usuario
console.log('🧪 Testing mapping function...\n');

const testCases = [
    'Barfer box Perro Cerdo 10kg',
    'Barfer box Perro Pollo 5kg',
    'Big Dog Pollo',
    'Huesos'
];

testCases.forEach((testCase, index) => {
    console.log(`📋 Test ${index + 1}: "${testCase}"`);
    const result = mapSelectOptionToDBFormat(testCase);
    console.log(`   Result: ${result.name} - ${result.option}\n`);
});

console.log('✅ Test completed!');
