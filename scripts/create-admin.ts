// Script to create first admin user
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function createFirstAdmin() {
  try {
    console.log('Creating first admin user...');
    
    const adminUserId = 'admin-1'; // This is the ID for the first admin
    
    // Check if admin already exists
    const [existing] = await db.select().from(users).where(eq(users.id, adminUserId));
    
    if (existing) {
      console.log('Admin user already exists:', existing.email);
      return existing;
    }
    
    // Create first admin user
    const [admin] = await db.insert(users).values({
      id: adminUserId,
      email: 'admin@cryptoflow.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true,
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    console.log('✅ Admin user created successfully!');
    console.log('Admin ID:', admin.id);
    console.log('Admin Email:', admin.email);
    console.log('Role:', admin.role);
    
    return admin;
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createFirstAdmin()
  .then(() => {
    console.log('\n🎉 Setup complete! You can now access admin features.');
    process.exit(0);
  })
  .catch(console.error);