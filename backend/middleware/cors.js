const cors = require('cors');

const allowedOrigins = [
    'http://localhost:5173', // Vite frontend dev server
    'http://localhost:3000', // fallback/frontend
    'http://localhost',
    'https://yourfrontenddomain.com'
];

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (curl, mobile apps)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('The CORS policy does not allow access from this origin.'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

module.exports = cors(corsOptions);
