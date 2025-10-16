# Migración de Templates y Campañas a MongoDB

## 📋 Resumen

Se ha migrado completamente el sistema de templates de email/WhatsApp y campañas programadas desde Prisma a MongoDB nativo, usando la misma estructura de `getCollection()` que el resto del proyecto.

## 🗄️ Colecciones MongoDB Creadas

### 1. `email_templates`
Almacena los templates de email reutilizables.

```javascript
{
  _id: ObjectId,
  name: string,           // Nombre del template
  subject: string,        // Asunto del email
  content: string,        // Contenido HTML/texto del email
  description: string,    // Descripción opcional
  isDefault: boolean,     // Si es un template por defecto del sistema
  createdBy: string,      // ID del usuario que lo creó
  createdAt: Date,
  updatedAt: Date
}
```

### 2. `whatsapp_templates`
Almacena los templates de WhatsApp reutilizables.

```javascript
{
  _id: ObjectId,
  name: string,           // Nombre del template
  content: string,        // Mensaje de WhatsApp
  description: string,    // Descripción opcional
  isDefault: boolean,     // Si es un template por defecto del sistema
  createdBy: string,      // ID del usuario que lo creó
  createdAt: Date,
  updatedAt: Date
}
```

### 3. `scheduled_email_campaigns`
Almacena campañas de email programadas con cron.

```javascript
{
  _id: ObjectId,
  name: string,           // Nombre de la campaña
  scheduleCron: string,   // Expresión cron para la programación
  targetAudience: {
    type: 'behavior' | 'spending',
    category: string      // ej: 'active', 'lost', 'premium', etc.
  },
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED',
  emailTemplateId: string, // ID del template a usar
  userId: string,         // ID del usuario que creó la campaña
  lastRun: Date,          // Última ejecución (opcional)
  nextRun: Date,          // Próxima ejecución (opcional)
  createdAt: Date,
  updatedAt: Date
}
```

### 4. `scheduled_whatsapp_campaigns`
Almacena campañas de WhatsApp programadas con cron.

```javascript
{
  _id: ObjectId,
  name: string,           // Nombre de la campaña
  scheduleCron: string,   // Expresión cron para la programación
  targetAudience: {
    type: 'behavior' | 'spending',
    category: string      // ej: 'active', 'lost', 'premium', etc.
  },
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED',
  whatsappTemplateId: string, // ID del template a usar
  userId: string,         // ID del usuario que creó la campaña
  lastRun: Date,          // Última ejecución (opcional)
  nextRun: Date,          // Próxima ejecución (opcional)
  createdAt: Date,
  updatedAt: Date
}
```

## 📝 Archivos Migrados

### 1. `/packages/data-services/src/services/templateService.ts`

**Funciones de Email Templates:**
- ✅ `getEmailTemplates(userId)` - Obtener templates del usuario
- ✅ `createEmailTemplate(userId, data)` - Crear nuevo template
- ✅ `updateEmailTemplate(templateId, userId, data)` - Actualizar template
- ✅ `deleteEmailTemplate(templateId, userId)` - Eliminar template

**Funciones de WhatsApp Templates:**
- ✅ `getWhatsAppTemplates(userId)` - Obtener templates del usuario
- ✅ `createWhatsAppTemplate(userId, data)` - Crear nuevo template
- ✅ `updateWhatsAppTemplate(templateId, userId, data)` - Actualizar template
- ✅ `deleteWhatsAppTemplate(templateId, userId)` - Eliminar template

**Cambios principales:**
- ❌ Removido: `import { database } from '@repo/database'`
- ✅ Agregado: `import { getCollection, ObjectId } from '@repo/database'`
- ✅ Reemplazado: Todos los queries de Prisma por queries nativos de MongoDB
- ✅ Conversión: `_id` de MongoDB a `id` string en las respuestas

### 2. `/packages/data-services/src/services/barfer/campaignsService.ts`

**Funciones de Email Campaigns:**
- ✅ `getActiveScheduledEmailCampaigns()` - Obtener campañas activas
- ✅ `createScheduledEmailCampaign(userId, data)` - Crear campaña
- ✅ `updateScheduledEmailCampaign(campaignId, data)` - Actualizar campaña
- ✅ `deleteScheduledEmailCampaign(campaignId)` - Eliminar campaña

**Funciones de WhatsApp Campaigns (NUEVO):**
- ✅ `getActiveScheduledWhatsAppCampaigns()` - Obtener campañas activas
- ✅ `createScheduledWhatsAppCampaign(userId, data)` - Crear campaña
- ✅ `updateScheduledWhatsAppCampaign(campaignId, data)` - Actualizar campaña
- ✅ `deleteScheduledWhatsAppCampaign(campaignId)` - Eliminar campaña

**Cambios principales:**
- ❌ Removido: `import type { Prisma } from '@repo/database'`
- ❌ Removido: `Prisma.ScheduledEmailCampaignGetPayload`
- ✅ Agregado: Interfaces TypeScript propias para las campañas
- ✅ Agregado: Funciones completas CRUD para WhatsApp campaigns

## 🔄 Migración de Datos (Si tienes datos en Prisma)

Si ya tenías templates o campañas en Prisma/PostgreSQL, necesitas migrarlos:

### Script de Migración (ejemplo)

```javascript
// scripts/migrate-templates-to-mongo.js
const { PrismaClient } = require('@prisma/client');
const { MongoClient } = require('mongodb');

const prisma = new PrismaClient();
const mongoUrl = process.env.MONGODB_URI;

async function migrateTemplates() {
  const client = new MongoClient(mongoUrl);
  await client.connect();
  
  const db = client.db();
  
  // Migrar Email Templates
  const emailTemplates = await prisma.emailTemplate.findMany();
  if (emailTemplates.length > 0) {
    await db.collection('email_templates').insertMany(
      emailTemplates.map(t => ({
        name: t.name,
        subject: t.subject,
        content: t.content,
        description: t.description,
        isDefault: t.isDefault,
        createdBy: t.createdBy,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
      }))
    );
    console.log(`✅ Migrados ${emailTemplates.length} templates de email`);
  }
  
  // Migrar WhatsApp Templates
  const whatsappTemplates = await prisma.whatsAppTemplate.findMany();
  if (whatsappTemplates.length > 0) {
    await db.collection('whatsapp_templates').insertMany(
      whatsappTemplates.map(t => ({
        name: t.name,
        content: t.content,
        description: t.description,
        isDefault: t.isDefault,
        createdBy: t.createdBy,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
      }))
    );
    console.log(`✅ Migrados ${whatsappTemplates.length} templates de WhatsApp`);
  }
  
  await client.close();
  await prisma.$disconnect();
}

migrateTemplates().catch(console.error);
```

## 🏗️ Inicialización de Colecciones

Si las colecciones no existen, MongoDB las crea automáticamente en el primer `insertOne()`. Sin embargo, puedes crear índices para mejorar el rendimiento:

### Índices Recomendados

```javascript
// Índices para email_templates
db.email_templates.createIndex({ createdBy: 1 });
db.email_templates.createIndex({ isDefault: 1 });
db.email_templates.createIndex({ createdAt: -1 });

// Índices para whatsapp_templates
db.whatsapp_templates.createIndex({ createdBy: 1 });
db.whatsapp_templates.createIndex({ isDefault: 1 });
db.whatsapp_templates.createIndex({ createdAt: -1 });

// Índices para scheduled_email_campaigns
db.scheduled_email_campaigns.createIndex({ userId: 1 });
db.scheduled_email_campaigns.createIndex({ status: 1 });
db.scheduled_email_campaigns.createIndex({ emailTemplateId: 1 });
db.scheduled_email_campaigns.createIndex({ nextRun: 1 });

// Índices para scheduled_whatsapp_campaigns
db.scheduled_whatsapp_campaigns.createIndex({ userId: 1 });
db.scheduled_whatsapp_campaigns.createIndex({ status: 1 });
db.scheduled_whatsapp_campaigns.createIndex({ whatsappTemplateId: 1 });
db.scheduled_whatsapp_campaigns.createIndex({ nextRun: 1 });
```

## ✅ Ventajas de la Migración

1. **Consistencia**: Todo el proyecto usa MongoDB, no hay mezcla de bases de datos
2. **Simplicidad**: No hay que mantener esquemas de Prisma separados
3. **Flexibilidad**: MongoDB permite esquemas más flexibles para templates
4. **Performance**: Queries directos a MongoDB sin capa adicional de Prisma
5. **Unificado**: Mismo patrón `getCollection()` que el resto del código

## 🔄 Compatibilidad con Código Existente

Las interfaces públicas de las funciones **NO cambiaron**, por lo que todo el código que usa estas funciones seguirá funcionando sin modificaciones:

```typescript
// ✅ Esto sigue funcionando exactamente igual
const templates = await getEmailTemplates(userId);
await createEmailTemplate(userId, { name, subject, content });
await deleteWhatsAppTemplate(templateId, userId);
```

## 🧪 Testing

Para probar la migración:

1. **Crear un template de email:**
```typescript
const template = await createEmailTemplate(userId, {
  name: 'Bienvenida',
  subject: 'Bienvenido a Barfer',
  content: 'Hola {{name}}, bienvenido...',
  description: 'Email de bienvenida para nuevos clientes'
});
```

2. **Obtener templates:**
```typescript
const templates = await getEmailTemplates(userId);
console.log('Templates:', templates);
```

3. **Crear una campaña programada:**
```typescript
const campaign = await createScheduledEmailCampaign(userId, {
  name: 'Reactivación mensual',
  scheduleCron: '0 10 * * 1', // Cada lunes a las 10am
  targetAudience: {
    type: 'behavior',
    category: 'lost'
  },
  status: 'ACTIVE',
  emailTemplate: {
    connect: {
      id: templateId
    }
  }
});
```

## 📚 Próximos Pasos

1. ✅ Ejecutar el script de índices en MongoDB
2. ✅ Si tienes datos en Prisma, ejecutar script de migración
3. ✅ Probar funcionalidades de templates y campañas
4. ✅ Eliminar schemas de Prisma relacionados (opcional)

---

**Fecha de migración**: 2025-10-16
**Versión**: 1.0
**Estado**: ✅ Completado

