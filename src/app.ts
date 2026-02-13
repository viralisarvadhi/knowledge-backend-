import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import ticketRoutes from './routes/ticket.routes';
import solutionRoutes from './routes/solution.routes';
import adminRoutes from './routes/admin.routes';
import userRoutes from './routes/user.routes';

const app = express();

// Middleware
app.use(cors());
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/solutions', solutionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/credits', require('./routes/credit.routes').default);
app.use('/api/notifications', require('./routes/notification.routes').default);

// Error handling
app.use(errorHandler);

export default app;
