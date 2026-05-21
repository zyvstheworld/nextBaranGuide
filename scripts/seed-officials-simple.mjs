import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { officialsData } = require('../src/lib/officialsData.cjs');

async function seedOfficials() {
  try {
    const port = process.env.SEED_SERVER_PORT || process.env.PORT || '3000';
    const base = `http://localhost:${port}`;
    const response = await fetch(`${base}/api/admin/officials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(officialsData),
    });

    const result = await response.json();
    console.log('✅ Officials seeded successfully!');
    console.log('Records inserted:', result.length);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedOfficials();
