'use client'

import { useState, useEffect } from 'react';
import { PriceSection, PriceType } from '@repo/data-services';
import { getAllUniqueProductsAction } from '../actions';
import { EditProductModal } from './EditProductModal';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@repo/design-system/components/ui/table';
import { Button } from '@repo/design-system/components/ui/button';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Pencil, Package } from 'lucide-react';
import { useToast } from '@repo/design-system/hooks/use-toast';

interface Product {
    section: PriceSection;
    product: string;
    weight: string | null;
    priceTypes: PriceType[];
    totalPrices: number;
    isActive: boolean;
}

interface ProductsManagerProps {
    userPermissions: string[];
}

export function ProductsManager({ userPermissions }: ProductsManagerProps) {
    const { toast } = useToast();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Verificar permisos del usuario
    const canEditPrices = userPermissions.includes('prices:edit');

    // Cargar productos únicos
    const loadProducts = async () => {
        setIsLoading(true);
        try {
            const result = await getAllUniqueProductsAction();
            if (result.success) {
                setProducts(result.products || []);
            } else {
                toast({
                    title: "Error",
                    description: result.message || "Error al cargar los productos",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error loading products:', error);
            toast({
                title: "Error",
                description: "Error al cargar los productos",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Cargar productos al montar el componente
    useEffect(() => {
        loadProducts();
    }, []);

    // Manejar edición de producto
    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setIsEditModalOpen(true);
    };

    // Manejar cierre del modal de edición
    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingProduct(null);
    };

    // Manejar actualización exitosa del producto
    const handleProductUpdated = () => {
        loadProducts(); // Recargar la lista
    };

    const getSectionLabel = (section: PriceSection) => {
        switch (section) {
            case 'PERRO': return 'PERRO';
            case 'GATO': return 'GATO';
            case 'OTROS': return 'OTROS';
            case 'RAW': return 'RAW';
            default: return section;
        }
    };

    const getSectionColor = (section: PriceSection) => {
        switch (section) {
            case 'PERRO': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'GATO': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'OTROS': return 'bg-green-100 text-green-800 border-green-200';
            case 'RAW': return 'bg-orange-100 text-orange-800 border-orange-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Gestión de Productos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Cargando productos...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Gestión de Productos ({products.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {products.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">No hay productos configurados.</p>
                        </div>
                    ) : (
                        <div className="rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="font-semibold">Sección</TableHead>
                                        <TableHead className="font-semibold">Producto</TableHead>
                                        <TableHead className="font-semibold text-center">Peso</TableHead>
                                        <TableHead className="font-semibold text-center">Tipos de Precio</TableHead>
                                        <TableHead className="font-semibold text-center">Estado</TableHead>
                                        {canEditPrices && (
                                            <TableHead className="font-semibold text-center">Acciones</TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {products.map((product, index) => (
                                        <TableRow key={`${product.section}-${product.product}-${product.weight || 'no-weight'}-${index}`}>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`${getSectionColor(product.section)} font-medium`}
                                                >
                                                    {getSectionLabel(product.section)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {product.product}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {product.weight ? (
                                                    <Badge variant="secondary" className="font-mono">
                                                        {product.weight}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex flex-wrap gap-1 justify-center">
                                                    {product.priceTypes.map((type) => (
                                                        <Badge key={type} variant="outline" className="text-xs">
                                                            {type.charAt(0) + type.slice(1).toLowerCase()}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={product.isActive ? "default" : "secondary"}>
                                                    {product.isActive ? "Activo" : "Inactivo"}
                                                </Badge>
                                            </TableCell>
                                            {canEditPrices && (
                                                <TableCell className="text-center">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleEditProduct(product)}
                                                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal para editar producto */}
            <EditProductModal
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
                onProductUpdated={handleProductUpdated}
                product={editingProduct}
            />
        </div>
    );
}
