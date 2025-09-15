import { getDictionary } from '@repo/internationalization';
import type { Locale } from '@repo/internationalization';
import { getAllPricesAction, getPricesByMonthAction } from './actions';
import { PricesTable } from './components/PricesTable';
import { ProductsManager } from './components/ProductsManager';
import { getCurrentUserWithPermissions } from '@repo/auth/server-permissions';
import type { Price as BarferPrice } from '@repo/data-services';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/design-system/components/ui/tabs';

export default async function PricesPage({
    params,
}: {
    params: Promise<{ locale: Locale }>;
}) {
    const { locale } = await params;
    const dictionary = await getDictionary(locale);

    // Obtener todos los precios usando la nueva acción de Barfer
    const result = await getAllPricesAction();
    const barferPrices = result.success ? (result.prices || []) : [];

    // Transformar los precios de MongoDB (_id) al formato esperado por el componente (id)
    // Asegurar que todos los valores sean serializables (sin ObjectId ni métodos toJSON)
    const prices = barferPrices.map((price: BarferPrice) => ({
        id: String(price._id), // Convertir explícitamente a string
        section: price.section, // Ya es PriceSection
        product: String(price.product),
        weight: price.weight ? String(price.weight) : null,
        priceType: price.priceType, // Ya es PriceType
        price: Number(price.price),
        isActive: Boolean(price.isActive)
    }));

    // Obtener permisos del usuario
    const userWithPermissions = await getCurrentUserWithPermissions();
    const userPermissions = (userWithPermissions?.permissions || []).map(p => String(p));

    return (
        <div className="h-full w-full">
            <div className="mb-5 p-5">
                <h1 className="text-2xl font-bold">
                    Gestión de Precios y Productos
                </h1>
                <p className="text-muted-foreground">
                    Administra los precios de todos los productos por sección y tipo de venta, y gestiona los productos.
                </p>
            </div>
            <div className="px-5">
                <Tabs defaultValue="prices" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="prices">📊 Precios</TabsTrigger>
                        <TabsTrigger value="products">📦 Productos</TabsTrigger>
                    </TabsList>
                    <TabsContent value="prices" className="mt-6">
                        <PricesTable
                            prices={prices}
                            dictionary={dictionary}
                            userPermissions={userPermissions}
                        />
                    </TabsContent>
                    <TabsContent value="products" className="mt-6">
                        <ProductsManager
                            userPermissions={userPermissions}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
} 