import { getCurrentUser } from '@repo/data-services/src/services/authService';
import { UserHeaderClient } from "./userHeaderClient";

type User = {
    id: string;
    name: string;
    lastName: string;
    email: string;
    role: any; // UserRole from Prisma
    permissions: any[]; // JsonArray from Prisma
} | null;

export async function UserHeaderServer() {
    const user = await getCurrentUser();
    return <UserHeaderClient user={user} />;
}