import express from 'express';
import cors from 'cors';
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
    if (Object.keys(req.body).length > 0) {
        console.log('Body:', JSON.stringify(req.body, null, 2));
    }
    next();
});
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({
            where: { email }
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
                role: user.role
            },
            token: `mock-token-${user.id}`
        });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/signup', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Simple check for existing user
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const user = await prisma.user.create({
            data: {
                email,
                name: req.body.name,
                password, // Note: Should be hashed in a real app
                role: role.toUpperCase()
            }
        });

        res.status(201).json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            token: `mock-token-${user.id}`
        });
    } catch (error) {
        console.error('--- SIGNUP ERROR START ---');
        console.error(error);
        if (error instanceof Error) {
            console.error('Message:', error.message);
            console.error('Stack:', error.stack);
        }
        console.error('--- SIGNUP ERROR END ---');
        res.status(500).json({ error: 'Signup failed' });
    }
});

// --- Students API ---
app.get('/api/students', async (req, res) => {
    try {
        const { parentId } = req.query;
        const students = await prisma.student.findMany({
            where: parentId ? { parentId: parentId as string } : {},
            include: {
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
        const { name, className, age, parentName } = req.body;
        const student = await prisma.student.create({
            data: { name, className, age, parentName }
        });
        res.status(201).json(student);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create student' });
    }
});

// --- Teachers API ---
app.get('/api/teachers', async (req, res) => {
    try {
        const teachers = await prisma.teacher.findMany();
        res.json(teachers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch teachers' });
    }
});

// --- Attendance API ---
app.get('/api/attendance', async (req, res) => {
    try {
        const attendance = await prisma.attendance.findMany({
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
        const studentCount = await prisma.student.count();
        const teacherCount = await prisma.teacher.count();
        const pendingFees = await prisma.fee.aggregate({
            _sum: { amount: true },
            where: { status: 'PENDING' }
        });

        const totalCollected = await prisma.fee.aggregate({
            _sum: { amount: true },
            where: { status: 'PAID' }
        });

        res.json({
            students: studentCount,
            teachers: teacherCount,
            totalPresent,
            pendingFees: pendingFees._sum.amount || 0,
            totalCollected: totalCollected._sum.amount || 0
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// --- Announcements API ---
app.get('/api/announcements', async (req, res) => {
    try {
        const announcements = await prisma.announcement.findMany({
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
        const { studentId, parentId } = req.query;
        const fees = await prisma.fee.findMany({
            where: {
                student: {
                    id: studentId as string,
                    parentId: parentId as string
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
