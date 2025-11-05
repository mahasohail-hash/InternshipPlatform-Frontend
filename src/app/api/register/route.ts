
import { hash } from 'bcryptjs';


export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ message: 'Email and password are required.' }), { status: 400 });
    }

    
    return new Response(
      JSON.stringify({ message: 'Registration through Next.js API is deprecated. Use backend /api/auth/register.' }),
      { status: 501 } 
    );

  } catch (error) {
    console.error('Registration error:', error);
    return new Response(JSON.stringify({ message: 'Internal server error during registration.' }), { status: 500 });
  }
}