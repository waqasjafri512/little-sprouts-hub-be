import pool from './src/db.js';
async function run() {
    const res = await pool.query("SELECT column_name, column_default, is_nullable FROM information_schema.columns WHERE table_name = 'users'");
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
}
run();
