import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import type { User } from '@/app/lib/definitions';
import bcrypt from 'bcrypt';

// Usuario admin por defecto
// En producción, esto debería estar en una base de datos
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@admin.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Administrador';

// Hash de la contraseña 'admin123' generado con bcrypt
// Para generar uno nuevo: bcrypt.hashSync('admin123', 10)
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '$2b$10$h2r/SVmV1UqDC2hFELw.RugFHozYtKHaJV1HcvIjxBG9oKb2hSU/C';

async function getUser(email: string): Promise<User | undefined> {
  try {
    // Verificar si es el usuario admin
    if (email === ADMIN_EMAIL) {
      return {
        id: '1',
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD_HASH,
      };
    }
    
    // Aquí puedes agregar más usuarios si es necesario
    // Por ahora solo soportamos el usuario admin
    return undefined;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return undefined;
  }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          
          if (!user) return null;
          
          // Comparar contraseña
          // Primero intentar comparación directa (más simple para desarrollo)
          if (password === ADMIN_PASSWORD && email === ADMIN_EMAIL) {
            return user;
          }
          
          // Si no coincide directamente, intentar con bcrypt
          try {
            const passwordsMatch = await bcrypt.compare(password, user.password);
            if (passwordsMatch) return user;
          } catch (bcryptError) {
            console.warn('Error en bcrypt:', bcryptError);
          }
        }

        console.log('Invalid credentials');
        return null;
      },
    }),
  ],
});
