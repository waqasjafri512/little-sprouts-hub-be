import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function testPrisma() {
    const connectionString = process.env.DATABASE_URL;
    console.log('Using connection string:', connectionString ? 'PRESENT' : 'MISSING');
    const pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        const schoolId = 'a2643e31-5cfc-4b7d-9a8a-60a2cdc63f3f';
        console.log('Testing classrooms for schoolId:', schoolId);

        const countBefore = await prisma.classroom.count({ where: { schoolId } });
        console.log('Count before:', countBefore);

        const newClass = await prisma.classroom.create({
            data: {
                name: 'Test Class ' + Date.now(),
                schoolId: schoolId
            }
        });
        console.log('Created class:', newClass.id);

        const classrooms = await prisma.classroom.findMany({ where: { schoolId } });
        console.log('Classrooms list size:', classrooms.length);

    } catch (error) {
        console.error('Prisma Test Error:', error);
    } finally {
        await pool.end();
    }
}

testPrisma();
