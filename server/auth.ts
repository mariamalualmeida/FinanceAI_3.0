import bcrypt from 'bcrypt';
import { storage } from './storage';
import type { InsertUser } from '@shared/schema';

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function createUser(userData: Omit<InsertUser, 'password'> & { password: string }) {
  const hashedPassword = await hashPassword(userData.password);
  return await storage.createUser({
    ...userData,
    password: hashedPassword
  });
}

export async function authenticateUser(username: string, password: string) {
  const user = await storage.getUserByUsername(username);
  if (!user) return null;

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) return null;

  // Retornar usuário sem senha
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}