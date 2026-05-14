/**
 * Database Seeding Script
 *
 * WHY SEED DATA?
 * - Populate development database
 * - Create test accounts
 * - Demo data for testing
 *
 * Run with: pnpm --filter @quizflow/api prisma:seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/** Prisma enum values (avoid named enum imports — they break under ESM + tsx in some setups). */
const Role = { USER: 'USER', ADMIN: 'ADMIN' } as const;
const Plan = { FREE: 'FREE', PRO: 'PRO' } as const;

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data (development only!)
  await prisma.usageRecord.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.fileUpload.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@quizflow.ai',
      password: adminPassword,
      name: 'Admin User',
      role: Role.ADMIN,
      plan: Plan.PRO,
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create free tier user
  const freePassword = await bcrypt.hash('Free123!', 10);
  const freeUser = await prisma.user.create({
    data: {
      email: 'free@example.com',
      password: freePassword,
      name: 'Free User',
      role: Role.USER,
      plan: Plan.FREE,
    },
  });
  console.log('✅ Created free user:', freeUser.email);

  // Create pro tier user
  const proPassword = await bcrypt.hash('Pro123!', 10);
  const proUser = await prisma.user.create({
    data: {
      email: 'pro@example.com',
      password: proPassword,
      name: 'Pro User',
      role: Role.USER,
      plan: Plan.PRO,
      stripeCustomerId: 'cus_test_123',
      stripeSubscriptionId: 'sub_test_123',
      subscriptionStatus: 'active',
    },
  });
  console.log('✅ Created pro user:', proUser.email);

  console.log('🎉 Seeding complete!');
  console.log('\n📝 Test Accounts:');
  console.log('Admin: admin@quizflow.ai / Admin123!');
  console.log('Free:  free@example.com / Free123!');
  console.log('Pro:   pro@example.com / Pro123!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

