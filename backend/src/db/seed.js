const { seedDatabase } = require('./index');

console.log('Starting database seeding...');
try {
  seedDatabase();
  console.log('✅ Seed completed successfully.');
  process.exit(0);
} catch (err) {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
}
