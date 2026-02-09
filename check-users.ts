import pool from './src/db.js';
async function check() {
    try {
        const resUsers = await pool.query("SELECT * FROM users");
        console.log("users:", JSON.stringify(resUsers.rows));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
