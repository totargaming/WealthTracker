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
  } finally {
    // Prevent the storage instance from attempting to create another admin user
    // by setting a flag or directly accessing any auto-initialization properties
    if (typeof storage['createAdminIfNeeded'] === 'function') {
      // Replace the function with a no-op to prevent it from running
      storage['createAdminIfNeeded'] = async () => {
        console.log('Admin creation via storage initialization skipped');
      };
    }
  }
}

createAdminUser();