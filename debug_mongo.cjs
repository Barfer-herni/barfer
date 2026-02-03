const { MongoClient, ObjectId } = require('mongodb');

async function main() {
  const uri = "mongodb+srv://nicolascaliari28:KCQa6YRnjYQSIXEV@cluster-fluxenet-dev.cwhkn.mongodb.net/barfer";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('barfer');
    
    const doc = await db.collection('salidas').findOne({ _id: new ObjectId("698238fe1d0a49bae7fa0433") });
    console.log("Documento Salida:", JSON.stringify(doc, null, 2));

    if (doc && doc.categoriaId) {
        const cat = await db.collection('categorias').findOne({ _id: doc.categoriaId });
        console.log("Categoría:", JSON.stringify(cat, null, 2));
    }

    const today = new Date("2026-02-03T00:00:00.000Z");
    const last30Days = new Date(today);
    last30Days.setDate(today.getDate() - 30);

    console.log("Today:", today.toISOString());
    console.log("Last 30 days start:", last30Days.toISOString());

  } finally {
    await client.close();
  }
}

main().catch(console.error);
