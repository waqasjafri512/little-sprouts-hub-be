import fs from 'fs';
import path from 'path';
import pool from './db.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const initDb = async () => {
    try {
        const sqlPath = path.join(__dirname, '..', 'init.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Initializing database...');
        await pool.query(sql);
        console.log('Database initialized successfully.');

        // Seed some initial data if needed
        const checkStudents = await pool.query('SELECT COUNT(*) FROM students');
        if (parseInt(checkStudents.rows[0].count) === 0) {
            console.log('Seeding initial data...');
            await pool.query(`
        INSERT INTO students (name, class_name, age, parent_name) 
        VALUES ('Emma Johnson', 'Nursery 2A', '4', 'Sarah Johnson')
      `);
            console.log('Seeding completed.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    }
};

initDb();
