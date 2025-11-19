
import { Pool, QueryResult, QueryResultRow } from 'pg';

async function connectToDatabase(): Promise<Pool> {
    
    return new Pool(/* ... connection options from .env ... */); 
}


export async function query<R extends QueryResultRow = any>(
    text: string,
    params?: any[] 
): Promise<QueryResult<R>> {
    const dbPool = await connectToDatabase();
    
    
    const result = await dbPool.query<R>(text, params) as QueryResult<R>;

    

    return result;
}



export async function query_fixed<R extends QueryResultRow = any>(
    text: string,
    params?: any[]
): Promise<QueryResult<R>> {
    const dbPool = await connectToDatabase();
    
    

    const result = await dbPool.query<R>(text, params); 
    
  

    return result;
}