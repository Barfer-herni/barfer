'use client';

import jsPDF from 'jspdf';

interface MayoristaOrderData {
    user: {
        name: string;
        lastName: string;
        email: string;
    };
    address: {
        address: string;
        city: string;
        phone: string;
    };
    items: Array<{
        name: string;
        fullName?: string;
        price: number;
        options: Array<{
            name: string;
            quantity: number;
            price?: number;
        }>;
    }>;
    total: number;
    deliveryDay: string;
    paymentMethod: string;
    notes?: string;
}

export function generateMayoristaPDF(orderData: MayoristaOrderData): void {
    const doc = new jsPDF();

    // Configuración de colores
    const primaryColor = [41, 128, 185]; // Azul
    const secondaryColor = [52, 73, 94]; // Gris oscuro
    const lightGray = [236, 240, 241]; // Gris claro

    // Título principal
    doc.setFontSize(20);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('ORDEN MAYORISTA', 20, 30);

    // Línea decorativa
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);

    // Información de la orden
    doc.setFontSize(14);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('INFORMACIÓN DE LA ORDEN', 20, 50);

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const deliveryDate = orderData.deliveryDay ? new Date(orderData.deliveryDay).toLocaleDateString('es-AR') : 'No especificada';
    doc.text(`Fecha de entrega: ${deliveryDate}`, 20, 60);
    doc.text(`Método de pago: ${orderData.paymentMethod}`, 20, 68);

    // Productos
    doc.setFontSize(14);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('PRODUCTOS', 20, 90);

    // Encabezado de la tabla de productos
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(20, 95, 170, 8, 'F');

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text('Producto', 22, 101);
    doc.text('Cantidad', 120, 101);
    doc.text('Precio Unit.', 150, 101);
    doc.text('Subtotal', 170, 101);

    let yPosition = 110;
    let totalCalculated = 0;

    // Filtrar items válidos (que tengan nombre y cantidad > 0)
    const validItems = orderData.items.filter(item =>
        item.name && item.name.trim() !== '' &&
        item.options[0]?.quantity > 0
    );

    validItems.forEach((item, index) => {
        const quantity = item.options[0]?.quantity || 1;
        const productName = item.fullName || item.name;

        // Alternar color de fondo para las filas
        if (index % 2 === 0) {
            doc.setFillColor(248, 249, 250);
            doc.rect(20, yPosition - 3, 170, 8, 'F');
        }

        // Producto
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        const maxWidth = 95;
        const lines = doc.splitTextToSize(productName, maxWidth);
        doc.text(lines, 22, yPosition);

        // Cantidad
        doc.text(quantity.toString(), 120, yPosition);

        // Precio unitario (usar el precio real del producto)
        const unitPrice = item.options[0]?.price || item.price || 0;
        doc.text(`$${Math.round(unitPrice)}`, 150, yPosition);

        // Subtotal
        const subtotal = unitPrice * quantity;
        totalCalculated += subtotal;
        doc.text(`$${Math.round(subtotal)}`, 170, yPosition);

        yPosition += Math.max(8, lines.length * 4);
    });

    // Línea separadora antes del total
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(20, yPosition + 5, 190, yPosition + 5);

    // Total
    yPosition += 15;
    doc.setFontSize(12);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('TOTAL A ABONAR:', 120, yPosition);

    doc.setFontSize(16);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`$${Math.round(orderData.total)}`, 170, yPosition);

    // Notas si existen
    if (orderData.notes && orderData.notes.trim() !== '') {
        yPosition += 20;
        doc.setFontSize(12);
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.text('NOTAS:', 20, yPosition);

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        const noteLines = doc.splitTextToSize(orderData.notes, 170);
        doc.text(noteLines, 20, yPosition + 8);
    }

    // Pie de página
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Generado el ' + new Date().toLocaleDateString('es-AR') + ' a las ' + new Date().toLocaleTimeString('es-AR'), 20, pageHeight - 20);
    doc.text('Barfer - Sistema de Gestión', 20, pageHeight - 15);

    // Generar nombre del archivo
    const fileName = `orden-mayorista-${orderData.user.name}-${orderData.user.lastName}-${new Date().toISOString().split('T')[0]}.pdf`;

    // Descargar el PDF
    doc.save(fileName);
}
