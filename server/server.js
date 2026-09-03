const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');

dotenv.config();

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

app.disable('x-powered-by');
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl) or any local dev origin
        if (!origin || allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
            return callback(null, true);
        }

        const error = new Error('Origin is not allowed by CORS policy');
        error.statusCode = 403;
        return callback(error);
    }
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Task Manager API is running smoothly!'
    });
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.stack);
    res.status(err.statusCode || 500).json({
        message: err.message || 'Internal Server Error'
    });
});

const startServer = async () => {
    const requiredEnvironmentVariables = ['MONGO_URI', 'JWT_SECRET'];
    const missingEnvironmentVariables = requiredEnvironmentVariables.filter(
        (name) => !process.env[name]
    );

    if (missingEnvironmentVariables.length > 0) {
        console.error(`Missing required environment variables: ${missingEnvironmentVariables.join(', ')}`);
        process.exit(1);
    }

    try {
        await connectDB();

        const PORT = process.env.PORT || 5001;
        const server = app.listen(PORT, () => {
            console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
        });

        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`❌ Port ${PORT} is already in use. To free port ${PORT}, run: npx kill-port ${PORT} or kill $(lsof -t -i:${PORT})`);
            } else {
                console.error('❌ Server Listen Error:', error.message);
            }
            process.exit(1);
        });
    } catch (error) {
        console.error('Server failed to start:', error.message);
        process.exit(1);
    }
};

if (require.main === module) {
    startServer();
}

module.exports = { app, startServer };
