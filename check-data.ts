import pool from './src/db.js';
async function check() {
    try {
        const resSnake = await pool.query("SELECT * FROM students");
        console.log("students (snake):", JSON.stringify(resSnake.rows));
        const resPascal = await pool.query('SELECT * FROM "Student"');
        console.log("Student (Pascal):", JSON.stringify(resPascal.rows));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
