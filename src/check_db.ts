import prisma from './client.js';

async function checkDb() {
    const schools = await prisma.school.findMany();
    const classrooms = await prisma.classroom.findMany();
    const students = await prisma.student.findMany();
    const users = await prisma.user.findMany();

    console.log('--- DB Check ---');
    console.log('Schools:', schools.length);
    schools.forEach(s => console.log(`- ${s.name} (${s.id}) joinCode: ${s.joinCode}`));

    console.log('Classrooms:', classrooms.length);
    classrooms.forEach(c => console.log(`- ${c.name} (ID: ${c.id}, School: ${c.schoolId})`));

    console.log('Students:', students.length);
    students.forEach(s => console.log(`- ${s.name} (ID: ${s.id}, School: ${s.schoolId}, Class: ${s.classId})`));

    console.log('Users:', users.length);
    users.forEach(u => console.log(`- ${u.email} (Role: ${u.role}, School: ${u.schoolId})`));

    await prisma.$disconnect();
}

checkDb();
