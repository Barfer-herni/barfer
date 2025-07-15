'use server';

import { getAllOrders } from '@repo/data-services/src/services/barfer/getAllOrders';
import * as XLSX from 'xlsx';

interface ExportParams {
    search?: string;
    from?: string;
    to?: string;
    orderType?: string;
}

export async function exportOrdersAction({
    search = '',
    from = '',
    to = '',
    orderType = '',
}: ExportParams): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
        const orders = await getAllOrders({
            search: search || '',
            sorting: [{ id: 'createdAt', desc: true }],
            from: from && from.trim() !== '' ? from : undefined,
            to: to && to.trim() !== '' ? to : undefined,
            orderType: orderType && orderType.trim() !== '' && orderType !== 'all' ? orderType : undefined,
        });

        if (orders.length === 0) {
            return { success: false, error: 'No se encontraron órdenes para exportar con los filtros seleccionados.' };
        }

        // Mapeo y aplanamiento de los datos para el Excel
        const dataToExport = orders.map(order => ({
            'Fecha Entrega': order.deliveryDay ? new Date(order.deliveryDay).toLocaleDateString('es-AR') : 'Sin fecha',
            'Fecha Creación': new Date(order.createdAt).toLocaleDateString('es-AR'),
            'Notas Propias': order.notesOwn || '',
            'Cliente': `${order.user?.name || ''} ${order.user?.lastName || ''}`.trim(),
            'Direccion': `${order.address?.address || ''}, ${order.address?.city || ''}`,
            'Telefono': order.address?.phone || '',
            'Email': order.user?.email || '',
            'Notas Cliente': order.notes || '',
            'Productos': order.items.map(item => `${item.name} x${(item.options[0] as any)?.quantity || 1}`).join('\n'),
            'Total': order.total,
            'Medio de Pago': order.paymentMethod || '',
            'Estado': order.status,
        }));

        // Crear el libro de trabajo y la hoja
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);

        // Ajustar el ancho de las columnas
        const columnWidths = [
            { wch: 12 }, // Fecha Entrega
            { wch: 12 }, // Fecha Creación
            { wch: 40 }, // Notas Propias
            { wch: 30 }, // Cliente
            { wch: 40 }, // Direccion
            { wch: 15 }, // Telefono
            { wch: 30 }, // Email
            { wch: 40 }, // Notas Cliente
            { wch: 60 }, // Productos
            { wch: 12 }, // Total
            { wch: 20 }, // Medio de Pago
            { wch: 15 }, // Estado
        ];
        worksheet['!cols'] = columnWidths;

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Órdenes');

        // Forzar alineación a la izquierda en las columnas 'Total' y 'Telefono'
        const leftAlignCols = ['Total', 'Telefono'];
        if (worksheet['!ref']) {
            const range = XLSX.utils.decode_range(worksheet['!ref']);
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const headerCell = worksheet[XLSX.utils.encode_col(C) + '1'];
                const header = headerCell?.v;
                if (typeof header === 'string' && leftAlignCols.includes(header)) {
                    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
                        const cellAddress = XLSX.utils.encode_col(C) + (R + 1);
                        if (!worksheet[cellAddress]) continue;
                        if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {};
                        worksheet[cellAddress].s.alignment = { horizontal: 'left' };
                    }
                }
            }
        }

        // Generar el buffer del archivo y convertirlo a base64 para serialización
        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
        const base64Data = buffer.toString('base64');

        return { success: true, data: base64Data };

    } catch (error) {
        console.error('Error exporting orders:', error);
        return { success: false, error: 'Ocurrió un error al generar el archivo Excel.' };
    }
} 