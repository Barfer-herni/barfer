export interface RepartoEntry {
    id: string;
    text: string;
    isCompleted: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface WeekData {
    [day: string]: RepartoEntry[];
}

export interface RepartosData {
    [weekKey: string]: WeekData;
}

export interface RepartosFilters {
    month?: number;
    year?: number;
    status?: 'all' | 'completed' | 'pending';
}

export interface RepartosStats {
    totalWeeks: number;
    completedEntries: number;
    totalEntries: number;
    completionRate: number;
}
