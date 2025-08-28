'use server';

import { getAllOrders } from '@repo/data-services/src/services/barfer/getAllOrders';
import * as XLSX from 'xlsx';
import { mapDBProductToSelectOption, normalizeScheduleTime } from './helpers';

interface ExportParams {
    search?: string;
    from?: string;
    to?: string;
    orderType?: string;
}

/**
 * Helper function to extract weight from product option name
 */
function getWeightFromOption(productName: string, optionName: string): string {
    const lowerProductName = productName.toLowerCase();

    if (lowerProductName.includes('big dog')) {
        return '15kg';
    }
    if (lowerProductName.includes('complemento')) {
        return '';
    }

    const match = optionName.match(/(\d+(?:\.\d+)?)\s*KG/i);
    if (match && match[1]) {
        return `${match[1]}kg`;
    }

    // Buscar peso en el nombre del producto también
    const productWeightMatch = lowerProductName.match(/(\d+(?:\.\d+)?)\s*k?g?/i);
    if (productWeightMatch && productWeightMatch[1]) {
        return `${productWeightMatch[1]}kg`;
    }

    return '';
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
            limit: 10000, // Límite de 10,000 órdenes para evitar problemas de memoria
        });

        if (orders.length === 0) {
            return { success: false, error: 'No se encontraron órdenes para exportar con los filtros seleccionados.' };
        }

        // Verificar si se alcanzó el límite
        if (orders.length === 10000) {
            console.warn('Se alcanzó el límite de 10,000 órdenes para la exportación. Considera usar filtros más específicos.');
        }

        // Función para normalizar el rango horario y extraer solo el horario sin el día
        const extractTimeOnly = (schedule: string): string => {
            if (!schedule) return 'N/A';

            // Primero normalizar el schedule (convertir "APROXIMADAMENTE" a "aprox", etc.)
            const normalizedSchedule = normalizeScheduleTime(schedule);

            // Extraer solo la parte del horario, eliminando el día si está presente
            // Buscar patrones como "De X:XXhs a X:XXhs aprox" o "X:XXhs a X:XXhs aprox"
            const timePattern = /(?:de\s+)?(\d{1,2}:\d{2}hs?\s+a\s+\d{1,2}:\d{2}hs?\s+aprox)/i;
            const match = normalizedSchedule.match(timePattern);

            if (match) {
                // Si encuentra el patrón, devolver solo el horario
                return match[1];
            }

            // Si no encuentra el patrón exacto, intentar extraer cualquier horario
            const fallbackPattern = /(\d{1,2}:\d{2}hs?\s+a\s+\d{1,2}:\d{2}hs?)/i;
            const fallbackMatch = normalizedSchedule.match(fallbackPattern);

            if (fallbackMatch) {
                // Agregar "aprox" si no está presente
                return fallbackMatch[1] + ' aprox';
            }

            // Si no se puede extraer, devolver el schedule normalizado
            return normalizedSchedule;
        };

        // Función para formatear las notas con información de dirección
        const formatNotes = (order: any): string => {
            const notes = order.notes || '';
            const address = order.address;

            if (!address) return notes;

            const parts = [];

            // Agregar reference si existe
            if (address.reference) parts.push(address.reference);

            // Agregar piso y departamento
            if (address.floorNumber || address.departmentNumber) {
                const floorDept = [address.floorNumber, address.departmentNumber].filter(Boolean).join(' ');
                if (floorDept) parts.push(floorDept);
            }

            // Agregar entre calles
            if (address.betweenStreets) parts.push(`Entre calles: ${address.betweenStreets}`);

            const addressInfo = parts.join(' / ');
            const allNotes = [notes, addressInfo].filter(Boolean).join(' / ');

            return allNotes || 'N/A';
        };

        // Mapeo y aplanamiento de los datos para el Excel
        const dataToExport = orders.map(order => ({
            'Fecha Entrega': order.deliveryDay ? new Date(order.deliveryDay).toLocaleDateString('es-AR') : 'Sin fecha',
            'Rango Horario': extractTimeOnly(order.deliveryArea?.schedule),
            'Cliente': `${order.user?.name || ''} ${order.user?.lastName || ''}`.trim(),
            'Direccion': `${order.address?.address || ''}, ${order.address?.city || ''}`,
            'Notas Cliente': formatNotes(order),
            'Productos': order.items.map(item => {
                // Reconstruir el nombre completo del producto usando mapDBProductToSelectOption
                const fullProductName = mapDBProductToSelectOption(
                    item.name,
                    (item.options[0] as any)?.name || ''
                );

                const quantity = (item.options[0] as any)?.quantity || 1;
                return `${fullProductName} - x${quantity}`;
            }).join('\r\n'),
            'Total': order.total,
            'Medio de Pago': order.paymentMethod || '',
            'Telefono': order.address?.phone || '',
            'Email': order.user?.email || '',
        }));

        // Crear el libro de trabajo y la hoja
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);

        // Ajustar el ancho de las columnas
        const columnWidths = [
            { wch: 12 }, // Fecha Entrega
            { wch: 25 }, // Rango Horario
            { wch: 30 }, // Cliente
            { wch: 40 }, // Direccion
            { wch: 40 }, // Notas Cliente
            { wch: 60 }, // Productos
            { wch: 12 }, // Total
            { wch: 20 }, // Medio de Pago
            { wch: 15 }, // Telefono
            { wch: 30 }, // Email
        ];
        worksheet['!cols'] = columnWidths;

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Órdenes');

        // Configurar formato de celdas
        if (worksheet['!ref']) {
            const range = XLSX.utils.decode_range(worksheet['!ref']);
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const headerCell = worksheet[XLSX.utils.encode_col(C) + '1'];
                const header = headerCell?.v;

                for (let R = range.s.r + 1; R <= range.e.r; ++R) {
                    const cellAddress = XLSX.utils.encode_col(C) + (R + 1);
                    if (!worksheet[cellAddress]) continue;
                    if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {};

                    // Alineación a la izquierda para Total y Telefono
                    if (typeof header === 'string' && ['Total', 'Telefono'].includes(header)) {
                        worksheet[cellAddress].s.alignment = { horizontal: 'left' };
                    }

                    // Configurar formato de texto con saltos de línea para Productos
                    if (typeof header === 'string' && header === 'Productos') {
                        worksheet[cellAddress].s.alignment = {
                            horizontal: 'left',
                            vertical: 'top'
                        };
                        worksheet[cellAddress].s.wrapText = true;
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