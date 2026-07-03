import express from 'express';
import cors from 'cors';
import { Request, Response } from 'express';
import path from 'path';

// Database Initialization
import './config/prisma';

// Route imports
import authRoutes from './routes/auth.route';
import studentRoutes from './routes/student.route';
import professorRoutes from './routes/professor.route';
import adminRoutes from './routes/admin.route';
import deviceRoutes from './routes/device.route';
import attachmentRoutes from './routes/attachment.route';
import { errorHandler, handleMulterError } from './middlewares/error.middleware';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rest API Routes
app.use('/auth', authRoutes);
app.use('/student', studentRoutes);
app.use('/professor', professorRoutes);
app.use('/admin', adminRoutes);
app.use('/device', deviceRoutes);
app.use('/attachments', attachmentRoutes);


// Serve public uploads only (profile images). Excuse attachments are sensitive
// and are served through the authenticated /attachments route instead.
app.use('/uploads/profiles', express.static(path.join(process.cwd(), 'uploads', 'profiles')));

// Health Check
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use(handleMulterError);
app.use(errorHandler);

export default app;