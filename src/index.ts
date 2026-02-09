import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './client.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- Students API ---
app.get('/api/students', async (req, res) => {
    try {
        const students = await prisma.student.findMany({
            include: {
                attendance: {
                    take: 1,
                    orderBy: { date: 'desc' }
                },
                fees: {
                    take: 1,
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

// --- Fee API ---
app.get('/api/fees', async (req, res) => {
    try {
        const fees = await prisma.fee.findMany({
            include: { student: true }
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
