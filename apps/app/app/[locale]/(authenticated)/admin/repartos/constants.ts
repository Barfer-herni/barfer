export const DAYS_OF_WEEK = {
    lunes: { label: 'Lunes', shortLabel: 'Lun', index: 1 },
    martes: { label: 'Martes', shortLabel: 'Mar', index: 2 },
    miercoles: { label: 'Miércoles', shortLabel: 'Mié', index: 3 },
    jueves: { label: 'Jueves', shortLabel: 'Jue', index: 4 },
    viernes: { label: 'Viernes', shortLabel: 'Vie', index: 5 },
    sabado: { label: 'Sábado', shortLabel: 'Sáb', index: 6 }
} as const;

export const DAY_ORDER = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'] as const;

export const ROWS_PER_DAY = 3;

export const TABLE_COLUMNS = {
    day: 120,
    row1: 200,
    row2: 200,
    row3: 200,
    checkbox: 60
};

export const STATUS_COLORS = {
    completed: 'bg-green-50 border-green-200',
    pending: 'bg-yellow-50 border-yellow-200',
    empty: 'bg-gray-50 border-gray-200'
};

export const PLACEHOLDER_TEXTS = {
    lunes: ['Repartidor 1', 'Repartidor 2', 'Repartidor 3'],
    martes: ['Repartidor 1', 'Repartidor 2', 'Repartidor 3'],
    miercoles: ['Repartidor 1', 'Repartidor 2', 'Repartidor 3'],
    jueves: ['Repartidor 1', 'Repartidor 2', 'Repartidor 3'],
    viernes: ['Repartidor 1', 'Repartidor 2', 'Repartidor 3'],
    sabado: ['Repartidor 1', 'Repartidor 2', 'Repartidor 3']
};
