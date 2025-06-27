import { jwtVerify } from 'jose';

export async function verifyToken(token) {
  const { payload } = await jwtVerify(
    token,
    new TextEncoder().encode(process.env.JWT_SECRET)
  );

  if (!payload.id || !payload.username) {
    throw new Error('Invalid token payload');
  }

  return {
    id: payload.id,
    username: payload.username,
  };
}
