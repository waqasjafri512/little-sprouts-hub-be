import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
// Real-time backend API for Little Sprouts Hub
import dotenv from 'dotenv';
import prisma from './client.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Body:', JSON.stringify(req.body, null, 2));
    }
    next();
});
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({
            where: { email },
            include: { school: true }
        });

        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // For simplicity, we just return the user data and a mock token
        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                schoolId: user.schoolId,
                schoolName: user.school?.name
            },
            token: `mock-token-${user.id}`
        });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/signup', async (req, res) => {
    try {
        const { email, password, role, name, schoolName, joinCode } = req.body;

        // Simple check for existing user
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        let schoolId = null;

        if (role.toUpperCase() === 'ADMIN') {
            if (!schoolName) return res.status(400).json({ error: 'School name is required for Admin' });

            // Create a new school
            const newSchool = await prisma.school.create({
                data: {
                    name: schoolName,
                    joinCode: Math.random().toString(36).substring(2, 8).toUpperCase() // Simple 6-char code
                }
            });
            schoolId = newSchool.id;
        } else {
            if (!joinCode) return res.status(400).json({ error: 'Join code is required' });

            const school = await prisma.school.findUnique({
                where: { joinCode: joinCode.toUpperCase() }
            });

            if (!school) return res.status(400).json({ error: 'Invalid join code' });
            schoolId = school.id;
        }

        const user = await prisma.user.create({
            data: {
                email,
                name,
                password, // Note: Should be hashed in a real app
                role: role.toUpperCase(),
                schoolId
            },
            include: { school: true }
        });

        res.status(201).json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                schoolId: user.schoolId,
                schoolName: user.school?.name
            },
            token: `mock-token-${user.id}`
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Signup failed' });
    }
});

// --- Classrooms API ---
app.get('/api/classrooms', async (req, res) => {
    try {
        const { schoolId } = req.query;
        if (!schoolId) return res.status(400).json({ error: 'schoolId is required' });

        const classrooms = await prisma.classroom.findMany({
            where: { schoolId: schoolId as string }
        });
        res.json(classrooms);
    } catch (error: any) {
        const errorLog = `[${new Date().toISOString()}] Fetch classrooms error: ${error.message}\n${error.stack}\n`;
        fs.appendFileSync('error.log', errorLog);
        res.status(500).json({ error: 'Failed to fetch classrooms', details: error.message });
    }
});

app.post('/api/classrooms', async (req, res) => {
    try {
        const { name, schoolId } = req.body;
        if (!schoolId) return res.status(400).json({ error: 'schoolId is required' });

        const classroom = await prisma.classroom.create({
            data: { name, schoolId }
        });
        res.status(201).json(classroom);
    } catch (error: any) {
        const errorLog = `[${new Date().toISOString()}] Create classroom error: ${error.message}\n${error.stack}\n`;
        fs.appendFileSync('error.log', errorLog);
        res.status(500).json({ error: 'Failed to create classroom', details: error.message });
    }
});

// --- Parents API ---
app.get('/api/parents', async (req, res) => {
    try {
        const { schoolId } = req.query;
        if (!schoolId) return res.status(400).json({ error: 'schoolId is required' });

        const parents = await prisma.user.findMany({
            where: {
                schoolId: schoolId as string,
                role: 'PARENT'
            },
            select: {
                id: true,
                name: true,
                email: true
            }
        });
        res.json(parents);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch parents' });
    }
});

// --- Students API ---
app.get('/api/students', async (req, res) => {
    try {
        const { parentId, schoolId, classId } = req.query;
        if (!schoolId) return res.status(400).json({ error: 'schoolId is required' });

        const students = await prisma.student.findMany({
            where: {
                schoolId: schoolId as string,
                ...(parentId ? { parentId: parentId as string } : {}),
                ...(classId ? { classId: classId as string } : {})
            },
            include: {
                classroom: true,
                attendance: {
                    take: 5,
                    orderBy: { date: 'desc' }
                },
                fees: {
                    take: 5,
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

app.post('/api/students', async (req, res) => {
    try {
        const { name, age, parentName, parentId, schoolId, classId } = req.body;
        if (!schoolId) return res.status(400).json({ error: 'schoolId is required' });

        const student = await prisma.student.create({
            data: {
                name,
                age,
                parentName,
                parentId: parentId || null,
                schoolId,
                classId: classId || null
            }
        });
        res.status(201).json(student);
    } catch (error) {
        console.error('Student creation error:', error);
        res.status(500).json({ error: 'Failed to create student' });
    }
});

// --- Teachers API ---
app.get('/api/teachers', async (req, res) => {
    try {
        const { schoolId } = req.query;
        if (!schoolId) return res.status(400).json({ error: 'schoolId is required' });

        const teachers = await prisma.teacher.findMany({
            where: { schoolId: schoolId as string }
        });
        res.json(teachers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch teachers' });
    }
});

app.post('/api/teachers', async (req, res) => {
    try {
        const { name, subject, classes, schoolId } = req.body;
        if (!schoolId) return res.status(400).json({ error: 'schoolId is required' });

        const teacher = await prisma.teacher.create({
            data: {
                name,
                subject,
                classes: Array.isArray(classes) ? classes : classes.split(',').map((c: string) => c.trim()),
                schoolId
            }
        });
        res.status(201).json(teacher);
    } catch (error) {
        console.error('Teacher creation error:', error);
        res.status(500).json({ error: 'Failed to create teacher' });
    }
});

// --- Attendance API ---
app.get('/api/attendance', async (req, res) => {
    try {
        const { schoolId } = req.query;
        if (!schoolId) return res.status(400).json({ error: 'schoolId is required' });

        const attendance = await prisma.attendance.findMany({
            where: { schoolId: schoolId as string },
            include: { student: true }
        });
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch attendance' });
    }
});

// --- Stats API ---
app.get('/api/stats', async (req, res) => {
    try {
        const { schoolId } = req.query;
        if (!schoolId) return res.status(400).json({ error: 'schoolId is required' });

        console.log(`Fetching stats for schoolId: ${schoolId}`);

        const [studentCount, teacherCount] = await Promise.all([
            prisma.student.count({ where: { schoolId: schoolId as string } }),
            prisma.teacher.count({ where: { schoolId: schoolId as string } })
        ]);

        const pendingFees = await prisma.fee.aggregate({
            _sum: { amount: true },
            where: {
                status: 'PENDING',
                schoolId: schoolId as string
            }
        });

        const totalCollected = await prisma.fee.aggregate({
            _sum: { amount: true },
            where: {
                status: 'PAID',
                schoolId: schoolId as string
            }
        });

        const totalPresent = await prisma.attendance.count({
            where: {
                schoolId: schoolId as string,
                status: 'PRESENT',
                date: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    lte: new Date(new Date().setHours(23, 59, 59, 999))
                }
            }
        });

        const school = await prisma.school.findUnique({
            where: { id: schoolId as string },
            select: { joinCode: true }
        });

        res.json({
            students: studentCount || 0,
            teachers: teacherCount || 0,
            totalPresent: totalPresent || 0,
            pendingFees: pendingFees._sum?.amount || 0,
            totalCollected: totalCollected._sum?.amount || 0,
            joinCode: school?.joinCode || 'N/A'
        });
    } catch (error: any) {
        console.error('Stats endpoint error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            details: error.message || 'Unknown error fetching stats'
        });
    }
});

// --- Announcements API ---
app.get('/api/announcements', async (req, res) => {
    try {
        const { schoolId } = req.query;
        if (!schoolId) return res.status(400).json({ error: 'schoolId is required' });

        const announcements = await prisma.announcement.findMany({
            where: { schoolId: schoolId as string },
            orderBy: { date: 'desc' }
        });
        res.json(announcements);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch announcements' });
    }
});

// --- Fee API ---
app.get('/api/fees', async (req, res) => {
    try {
        const { studentId, parentId, schoolId } = req.query;
        if (!schoolId) return res.status(400).json({ error: 'schoolId is required' });

        const fees = await prisma.fee.findMany({
            where: {
                schoolId: schoolId as string,
                student: {
                    ...(studentId ? { id: studentId as string } : {}),
                    ...(parentId ? { parentId: parentId as string } : {})
                }
            },
            include: { student: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(fees);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch fees' });
    }
});

// --- Health Check ---
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
