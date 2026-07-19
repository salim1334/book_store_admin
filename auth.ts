import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { getUserByEmail, verifyPassword } from '@/lib/auth';
import { z } from 'zod';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {        
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { email, password } = parsedCredentials.data;
        
        const user = await getUserByEmail(email);
        
        if (!user) {
          return null;
        }
        
        if (!user.password) {
          return null;
        }
        
        if (!user.isActive) {
          return null;
        }
        
        const passwordsMatch = await verifyPassword(password, user.password);
        
        if (passwordsMatch) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        }
        
        return null;
      },
    }),
  ],
});
