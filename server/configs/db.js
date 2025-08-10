import { neon } from "@neondatabase/serverless";

// Validate database URL exists
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined in environment variables');
}

// Create connection
const sql = neon(process.env.DATABASE_URL);

// Test connection function
export const testConnection = async () => {
    try {
        const result = await sql`SELECT NOW() as current_time`;
        console.log('✅ Database connected successfully at:', result[0].current_time);
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
};

export default sql;