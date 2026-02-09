import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: "postgresql://postgres:82882%40Propdev@localhost:5432/postgres?schema=public"
});

async function testConnection() {
    try {
        await client.connect();
        console.log("Connected successfully to PostgreSQL!");

        const checkRes = await client.query("SELECT 1 FROM pg_database WHERE datname = 'little-sprouts-hub'");
        if (checkRes.rowCount === 0) {
            console.log("Creating database 'little-sprouts-hub'...");
            await client.query('CREATE DATABASE "little-sprouts-hub"');
            console.log("Database created successfully.");
        } else {
            console.log("Database 'little-sprouts-hub' already exists.");
        }

        await client.end();
    } catch (err) {
        console.error("Connection failed:", err);
    }
}

testConnection();
