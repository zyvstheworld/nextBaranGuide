import { demographicsData } from '../src/lib/demographicsData';

async function seedDemographics() {
  try {
    const response = await fetch('http://localhost:3001/api/admin/demographics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(demographicsData),
    });

    const result = await response.json();
    console.log('✅ Demographics seeded successfully!');
    console.log('Records inserted:', result.length);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDemographics();
