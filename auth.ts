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
        console.log('🔐 [AUTH] Starting authentication...');
        console.log('📧 [AUTH] Credentials received:', { email: credentials?.email });
        
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          console.log('❌ [AUTH] Validation failed:', parsedCredentials.error);
          return null;
        }

        const { email, password } = parsedCredentials.data;
        console.log('✅ [AUTH] Credentials validated');
        
        const user = await getUserByEmail(email);
        console.log('👤 [AUTH] User lookup result:', user ? 'Found' : 'Not found');
        
        if (!user) {
          console.log('❌ [AUTH] User not found in database');
          return null;
        }
        
        if (!user.password) {
          console.log('❌ [AUTH] User has no password set');
          return null;
        }
        
        if (!user.isActive) {
          console.log('❌ [AUTH] User account is inactive');
          return null;
        }
        
        console.log('🔑 [AUTH] Verifying password...');
        const passwordsMatch = await verifyPassword(password, user.password);
        console.log('🔑 [AUTH] Password match:', passwordsMatch);
        
        if (passwordsMatch) {
          console.log('✅ [AUTH] Login successful for:', user.email);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        }
        
        console.log('❌ [AUTH] Password incorrect');
        return null;
      },
    }),
  ],
});
