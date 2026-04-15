const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ✅ Yahan apna naya password likhein
const NEW_PASSWORD = 'Admin@123';
const ADMIN_EMAIL = 'admin@greenbasket.com';

const MONGO_URI = 'mongodb://localhost:27017/greenbasket';

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
});

const User = mongoose.model('User', userSchema);

async function resetAdmin() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB se connect ho gaya');

  const hashed = await bcrypt.hash(NEW_PASSWORD, 10);

  const result = await User.findOneAndUpdate(
    { email: ADMIN_EMAIL, role: 'admin' },
    { password: hashed },
    { new: true }
  );

  if (!result) {
    console.log('❌ Admin user nahi mila! Naya admin bana raha hun...');

    await User.create({
      name: 'Admin User',
      email: ADMIN_EMAIL,
      password: hashed,
      role: 'admin',
    });

    console.log('✅ Naya admin bana diya!');
  } else {
    console.log(`✅ Admin password reset ho gaya!`);
  }

  console.log('\n🔐 Login Details:');
  console.log(`   Email   : ${ADMIN_EMAIL}`);
  console.log(`   Password: ${NEW_PASSWORD}`);

  await mongoose.disconnect();
}

resetAdmin().catch(console.error);