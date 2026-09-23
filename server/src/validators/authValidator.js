import { z } from 'zod';

export const googleAuthSchema = z.object({
  credential: z
    .string({ required_error: 'Google ID token credential is required' })
    .min(10, 'Google credential token must be a valid JWT string'),
});
