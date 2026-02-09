import prisma from './client.js';

const initDb = async () => {
    try {
        console.log('Cleaning up database...');
        // Order matters for deletions due to foreign keys
        await prisma.attendance.deleteMany();
        await prisma.fee.deleteMany();
        await prisma.dailyUpdate.deleteMany();
        await prisma.student.deleteMany();
        await prisma.teacher.deleteMany();
        await prisma.notification.deleteMany();
        await prisma.announcement.deleteMany();
        await prisma.user.deleteMany();

        console.log('Seeding users...');
        const admin = await prisma.user.create({
            data: {
                email: 'admin@nursery.com',
                password: 'admin123',
                role: 'ADMIN'
            }
        });

        const parentUser = await prisma.user.create({
            data: {
                email: 'parent@nursery.com',
                password: 'parent123',
                role: 'PARENT'
            }
        });

        const teacherUser = await prisma.user.create({
            data: {
                email: 'teacher@nursery.com',
                password: 'teacher123',
                role: 'TEACHER'
            }
        });

        console.log('Seeding students and linking to parent...');
        const emma = await prisma.student.create({
            data: {
                name: 'Emma Johnson',
                className: 'Nursery 2A',
                age: '4',
                parentName: 'Sarah Johnson',
                parentId: parentUser.id
            }
        });

        const liam = await prisma.student.create({
            data: {
                name: 'Liam Smith',
                className: 'Nursery 2A',
                age: '3',
                parentName: 'Sarah Johnson', // Assuming same parent for demo
                parentId: parentUser.id
            }
        });

        console.log('Seeding teacher profile...');
        await prisma.teacher.create({
            data: {
                name: 'Ms. Clara',
                subject: 'Early Years',
                classes: ['Nursery 2A', 'Reception'],
                userId: teacherUser.id
            }
        });

        console.log('Seeding attendance for Emma...');
        await prisma.attendance.createMany({
            data: [
                { studentId: emma.id, status: 'PRESENT', date: new Date(Date.now() - 86400000) },
                { studentId: emma.id, status: 'PRESENT', date: new Date() }
            ]
        });

        console.log('Seeding fees for Emma...');
        await prisma.fee.createMany({
            data: [
                { studentId: emma.id, amount: 150, status: 'PENDING', month: 'February 2026' },
                { studentId: emma.id, amount: 150, status: 'PAID', month: 'January 2026' }
            ]
        });

        console.log('Seeding announcements...');
        await prisma.announcement.createMany({
            data: [
                { title: 'School Trip', content: 'We are planning a trip to the local farm next Friday.' },
                { title: 'New Menu', content: 'Our spring menu is now active in the canteen.' }
            ]
        });

        console.log('Database seeding completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    }
};

initDb();
