import { mapSelectOptionToDBFormat, processOrderItems } from '../packages/data-services/src/services/barfer/productMapping';

// Probar el caso específico del usuario
const testItem = {
    id: "BOX PERRO POLLO",
    name: "Barfer box Perro Cerdo 10kg",
    description: "",
    images: [],
    options: [
        {
            name: "10KG",
            price: 0,
            quantity: 1
        }
    ],
    price: 0,
    salesCount: 0,
    discountApllied: 0
};

console.log('🧪 Testing with user\'s specific case...\n');

console.log('📦 Input item:');
console.log(JSON.stringify(testItem, null, 2));

console.log('\n🔄 Testing mapSelectOptionToDBFormat directly:');
const directMapping = mapSelectOptionToDBFormat(testItem.name);
console.log('Result:', directMapping);

console.log('\n🔄 Testing processOrderItems:');
const processedItems = processOrderItems([testItem]);
console.log('Processed items:', JSON.stringify(processedItems, null, 2));

console.log('\n✅ Test completed!');
