import { getCollection } from '../packages/database/index.ts';

async function diagnose() {
    try {
        const collection = await getCollection('stock');

        console.log('--- Diagnosing Stock Records ---');

        const jan27 = await collection.find({
            fecha: '2026-01-27',
            producto: { $regex: /POLLO/i },
            peso: '5KG'
        }).toArray();

        const jan28 = await collection.find({
            fecha: '2026-01-28',
            producto: { $regex: /POLLO/i },
            peso: '5KG'
        }).toArray();

        console.log('Jan 27 Records:', JSON.stringify(jan27, null, 2));
        console.log('Jan 28 Records:', JSON.stringify(jan28, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('Error during diagnosis:', error);
        process.exit(1);
    }
}

diagnose();
