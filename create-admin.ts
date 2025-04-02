import { hashPassword } from './server/auth-utils';
import { storage } from './server/storage';

async function createAdminUser() {
  try {
    // Check if admin already exists
    const existingAdmin = await storage.getUserByUsername('admin');
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }
    
    // Create admin user with hashed password
    const hashedPassword = await hashPassword('admin123');
    
    const adminUser = await storage.createUser({
      username: 'admin',
      password: hashedPassword,
      email: 'admin@fintrack.com',
      fullName: 'Admin User',
      role: 'admin',
    });
    
    console.log('Admin user created successfully:', adminUser.username);
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser();