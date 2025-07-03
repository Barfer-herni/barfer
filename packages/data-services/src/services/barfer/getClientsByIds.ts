import 'server-only';
import { getCollection } from '@repo/database';

interface ClientInfo {
    id: string;
    name: string;
    email: string;
}

/**
 * Fetches basic client information directly from the 'orders' collection in MongoDB
 * based on a list of client identifiers (which can be user IDs or emails).
 * This is an efficient way to get data for manually selected clients.
 */
export async function getClientsByIds(clientIds: string[]): Promise<ClientInfo[]> {
    if (!clientIds || clientIds.length === 0) {
        return [];
    }

    try {
        const ordersCollection = await getCollection('orders');

        const pipeline = [
            // 1. Match orders where the user identifier is in the provided list
            {
                $match: {
                    $or: [
                        { 'user.id': { $in: clientIds } },
                        { 'user.email': { $in: clientIds } }
                    ]
                }
            },
            // 2. Group by user to get unique client details
            {
                $group: {
                    _id: { $ifNull: ['$user.id', '$user.email'] },
                    name: { $first: '$user.name' },
                    lastName: { $first: '$user.lastName' },
                    email: { $first: '$user.email' }
                }
            },
            // 3. Safety filter to ensure we only return clients we asked for
            {
                $match: {
                    _id: { $in: clientIds }
                }
            }
        ];

        const clientsFromDb: any[] = await ordersCollection.aggregate(pipeline).toArray();

        const clients = clientsFromDb.map(client => ({
            id: client._id,
            name: `${client.name || ''} ${client.lastName || ''}`.trim(),
            email: client.email,
        }));

        return clients;

    } catch (error) {
        console.error('Error fetching clients by IDs from Orders:', error);
        throw new Error('Could not fetch clients by IDs.');
    }
} 