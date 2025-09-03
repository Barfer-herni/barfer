// Script de prueba para las funciones de formateo de teléfonos
import { formatPhoneNumber, validateAndNormalizePhone } from './helpers';

console.log('🧪 Probando funciones de formateo de teléfonos...\n');

// Casos de prueba para formatPhoneNumber
const testCases = [
    // La Plata
    { input: '5491140756659', expected: '221 407-5665' },
    { input: '+5491140756659', expected: '221 407-5665' },
    { input: '5491140756659', expected: '221 407-5665' },
    { input: '02214075665', expected: '221 407-5665' },
    { input: '2214075665', expected: '221 407-5665' },
    { input: '221 407-5665', expected: '221 407-5665' },
    
    // CABA y resto de Buenos Aires
    { input: '5491140756659', expected: '11-4075-6659' },
    { input: '+5491140756659', expected: '11-4075-6659' },
    { input: '5491140756659', expected: '11-4075-6659' },
    { input: '1140756659', expected: '11-4075-6659' },
    { input: '11-4075-6659', expected: '11-4075-6659' },
    { input: '1540756659', expected: '15-4075-6659' },
    { input: '15-4075-6659', expected: '15-4075-6659' },
    
    // Casos inválidos
    { input: '123', expected: '123' }, // Muy corto
    { input: '123456789012345', expected: '123456789012345' }, // Muy largo
    { input: '', expected: 'N/A' }, // Vacío
    { input: null, expected: 'N/A' }, // Null
];

console.log('📞 Probando formatPhoneNumber:');
testCases.forEach((testCase, index) => {
    const result = formatPhoneNumber(testCase.input);
    const status = result === testCase.expected ? '✅' : '❌';
    console.log(`${status} Test ${index + 1}: "${testCase.input}" -> "${result}" (esperado: "${testCase.expected}")`);
});

console.log('\n🔍 Probando validateAndNormalizePhone:');
const validationTests = [
    // Casos válidos
    { input: '2214075665', expected: '2214075665', valid: true },
    { input: '1140756659', expected: '1140756659', valid: true },
    { input: '1540756659', expected: '1540756659', valid: true },
    { input: '5491140756659', expected: '1140756659', valid: true },
    { input: '+5491140756659', expected: '1140756659', valid: true },
    
    // Casos inválidos
    { input: '123', expected: null, valid: false },
    { input: '123456789012345', expected: null, valid: false },
    { input: '', expected: null, valid: false },
    { input: '9999999999', expected: null, valid: false }, // No empieza con 11, 15 o 221
];

validationTests.forEach((testCase, index) => {
    const result = validateAndNormalizePhone(testCase.input);
    const status = (result === testCase.expected) === testCase.valid ? '✅' : '❌';
    console.log(`${status} Test ${index + 1}: "${testCase.input}" -> "${result}" (esperado: "${testCase.expected}", válido: ${testCase.valid})`);
});

console.log('\n✨ Pruebas completadas!');
