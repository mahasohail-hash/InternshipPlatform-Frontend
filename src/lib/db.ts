// src/lib/db.ts

// 1. Ensure these imports are correct
import { Pool, QueryResult, QueryResultRow } from 'pg';

// Assuming you have a function to get your database pool connection
async function connectToDatabase(): Promise<Pool> {
    // ... logic to connect (omitted for brevity)
    // For now, assume this returns a connected Pool
    return new Pool(/* ... connection options from .env ... */); 
}


// This is your function that has the error (now corrected)
export async function query<R extends QueryResultRow = any>(
    text: string,
    params?: any[] // params is an optional array of values
): Promise<QueryResult<R>> {
    const dbPool = await connectToDatabase();
    
    // FIX: Use the dbPool.query() method which returns the standard QueryResult<R> type.
    // The issue often arises from internal overloads when using array parameters.
    // By casting it to the expected generic type, we satisfy the function's promise.
    // We are telling TypeScript: "I know this returns a standard QueryResult."
    const result = await dbPool.query<R>(text, params) as QueryResult<R>;

    // We don't need to manually release the connection if using a Pool's .query() method, 
    // but if you are acquiring a client (dbPool.connect()), you would need to client.release().

    // Ensure we handle the connection closure if needed, but for a simple query wrapper, 
    // the Pool manages the connection lifecycle.

    return result;
}

// ---------------------------------------------------------------------------------------
// Alternative (and often cleaner) fix:
// ---------------------------------------------------------------------------------------

export async function query_fixed<R extends QueryResultRow = any>(
    text: string,
    params?: any[]
): Promise<QueryResult<R>> {
    const dbPool = await connectToDatabase();
    
    // The .query() method is generic and should correctly infer the return type based
    // on the explicit generic provided: dbPool.query<R>(...)
    // The previous error suggests that your project's TypeScript configuration 
    // is being too strict about the array vs. object row types. 
    // Explicitly using the generic on the query method usually resolves this:

    const result = await dbPool.query<R>(text, params); 
    
    // If the error persists after adding the <R> generic above, use a simple cast:
    // const result = (await dbPool.query(text, params)) as QueryResult<R>;

    return result;
}