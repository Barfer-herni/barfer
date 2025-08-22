// Script simple para probar la función de mapeo
function mapSelectOptionToDBFormat(selectOption) {
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
        }
    }
    
    return { name: selectOption.toUpperCase(), option: '' };
}

// Probar el caso específico del usuario
const testInput = 'Barfer box Perro Cerdo 10kg';
console.log('🧪 Testing with:', testInput);

const result = mapSelectOptionToDBFormat(testInput);
console.log('✅ Result:', result);

// Verificar que el mapeo es correcto
if (result.name === 'BOX PERRO CERDO' && result.option === '10KG') {
    console.log('🎉 SUCCESS: Mapping is working correctly!');
} else {
    console.log('❌ FAILED: Mapping is not working correctly');
}
