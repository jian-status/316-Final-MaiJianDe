// THESE ARE NODE APIs WE WISH TO USE
const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const cookieParser = require('cookie-parser')

// CREATE OUR SERVER
dotenv.config()
const PORT = process.env.PORT || 4000;
const app = express()

// SETUP THE MIDDLEWARE
app.use(express.urlencoded({ extended: true }))
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:4001"],
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())

let db = null;

async function startServer() {
    try {
        console.log('Starting server...');
        const PostgresManager = require('./db/postgre');
        db = new PostgresManager();
        await db.connection;
        console.log('Database connected, resetting DB...');
        await db.resetDB(); 
        console.log('Database reset complete');
        
        module.exports.db = db;
        
        const authRouter = require('./routes/auth-router')
        app.use('/auth', authRouter)
        const storeRouter = require('./routes/store-router')
        app.use('/store', storeRouter)
        app.listen(PORT, () => {
        
    });
        
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();