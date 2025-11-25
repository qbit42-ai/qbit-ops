require('dotenv').config();
const { connectOpsDb } = require('../src/config/database');
const getAdminModel = require('../src/models/Admin');

async function createAdmin() {
  try {
    // Connect to ops database
    console.log('Connecting to qbit-ops database...');
    await connectOpsDb();
    console.log('Connected to qbit-ops database');

    // Default admin credentials
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@local.test';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // Get Admin model from ops connection
    const Admin = await getAdminModel();

    const existingAdmin = await Admin.findOne({ email: adminEmail });
    if (existingAdmin) {
      await Admin.deleteOne({ email: adminEmail });
      console.log(`Admin user with email ${adminEmail} deleted`);
    }

    const admin = new Admin({
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    });

    await admin.save();
    console.log('✅ Admin user created successfully!');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('   ⚠️  Please change the password after first login');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();