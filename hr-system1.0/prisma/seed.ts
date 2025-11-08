// prisma/seed.ts (Correct Unchecked Input Structure & Robust Execution)

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

// Define a static list of required Leave Types
const defaultLeaveTypes = [
    { name: 'Annual Leave', defaultDays: 20 },
    { name: 'Sick Leave', defaultDays: 10 },
    { name: 'Paternity Leave', defaultDays: 5 },
    { name: 'Maternity Leave', defaultDays: 90 },
    { name: 'Bereavement Leave', defaultDays: 3 },
];

async function main() {
    console.log('Starting database seeding...');

    // ------------------------------------------
    // 1. Seed Roles
    // ------------------------------------------
    console.log('Seeding Roles...');
    const adminRole = await prisma.role.upsert({
        where: { name: 'Administrator' },
        update: {},
        create: { name: 'Administrator' },
    });

    const hrRole = await prisma.role.upsert({
        where: { name: 'HR Manager' },
        update: {},
        create: { name: 'HR Manager' },
    });
    
    // ------------------------------------------
    // 2. Seed Default HR Admin User
    // ------------------------------------------
    const HR_ADMIN_EMAIL = 'hr.admin@inovera.com'; // Define constant for consistency
    console.log(`Seeding HR Admin User (${HR_ADMIN_EMAIL})...`);
    const defaultPassword = 'password123';
    const hashedPassword = await hash(defaultPassword, 10);

    await prisma.user.upsert({
        where: { email: HR_ADMIN_EMAIL },
        
        // Use Unchecked Update Input (no 'data' wrapper)
        update: { 
            hashedPassword: hashedPassword, 
            roleId: hrRole.id,
            // Only update fields that might change if the record exists
            fullName: 'Inovera HR Admin', 
        },
        
        // Use Unchecked Create Input (no 'data' wrapper)
        create: {
            // FIX: Ensure this email matches the WHERE clause email
            email: HR_ADMIN_EMAIL, 
            fullName: 'Inovera HR Admin',
            hashedPassword: hashedPassword,
            roleId: hrRole.id,
            isActive: true,
            jobTitle: 'HR Manager',
        },
    });

    console.log(`Default HR Admin user created/updated (Email: ${HR_ADMIN_EMAIL} | Pass: ${defaultPassword}).`);

    // ------------------------------------------
    // 3. Seed Leave Types
    // ------------------------------------------
    console.log('Seeding Leave Types...');
    for (const type of defaultLeaveTypes) {
        await prisma.leaveType.upsert({
            where: { name: type.name },
            
            // Use Unchecked Update Input (no 'data' wrapper)
            update: { 
                defaultDays: type.defaultDays,
            },
            
            // Use Unchecked Create Input (no 'data' wrapper)
            create: {
                name: type.name,
                defaultDays: type.defaultDays,
            },
        });
        console.log(`- Created/Updated Leave Type: ${type.name} (${type.defaultDays} days)`);
    }

    console.log('Database seeding complete! 🎉');
}

// ------------------------------------------------------------------
// Robust execution wrapper to prevent silent exit before DB finish
// ------------------------------------------------------------------
main()
  .catch((e) => {
    // This catches connection errors, password hash errors, and other exceptions.
    console.error('SEEDING FAILED:', e);
    process.exit(1);
  })
  .finally(async () => {
    // This ensures the connection is closed after all ops are done.
    await prisma.$disconnect();
    console.log('Prisma disconnected.');
  });