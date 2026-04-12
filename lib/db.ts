/**
 * Deprecated: The application now uses Supabase.
 * Please use '@/lib/supabase' for database operations.
 */

console.log('[DB] 🚀 Database switched to Supabase.');

export async function connectToDatabase() {
  // Return a dummy object to prevent immediate crashes in unmigrated routes
  return { 
    client: null, 
    db: { 
      collection: (name: string) => ({
        find: () => ({ toArray: async () => [] }),
        findOne: async () => null,
        insertOne: async () => ({ insertedId: 'deprecated' }),
        updateOne: async () => ({ modifiedCount: 0 }),
        deleteOne: async () => ({ deletedCount: 0 }),
      })
    } 
  };
}

export function getDatabase() {
  return null;
}
