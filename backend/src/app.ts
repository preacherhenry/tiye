import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import rideRoutes from './routes/rideRoutes';
import adminRoutes from './routes/adminRoutes';
import driverRoutes from './routes/driverRoutes';
import promotionRoutes from './routes/promotionRoutes';
import placesRoutes from './routes/placesRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import settingsRoutes from './routes/settingsRoutes';
import fareRoutes from './routes/fareRoutes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Enhanced Request/Response logging
app.use((req, res, next) => {
    const originalSend = res.send;
    let body = '';

    // Capture request body
    const reqBody = JSON.stringify(req.body);

    res.send = function (data) {
        body = data;
        const log = `[${new Date().toISOString()}] ${req.method} ${req.url}
   Request: ${reqBody}
   Status: ${res.statusCode}
   Response: ${body}
----------------------------------------\n`;
        require('fs').appendFileSync('request_logs.txt', log);
        return originalSend.apply(res, arguments as any);
    };
    next();
});

// Routes
const corsOptions = {
    setHeaders: (res: any) => {
        res.set('Access-Control-Allow-Origin', '*');
    }
};
app.use('/uploads', express.static('uploads', corsOptions)); // Serve uploaded files with CORS
app.use('/settings', settingsRoutes);
app.use('/', authRoutes);
app.use('/', rideRoutes);
app.use('/admin', adminRoutes);
app.use('/driver', driverRoutes);
app.use('/', promotionRoutes);
app.use('/places', placesRoutes);
app.use('/subscriptions', subscriptionRoutes);
app.use('/fares', fareRoutes);

app.get('/', (req: Request, res: Response) => {
    res.json({ status: "Taxi node backend running" });
});

import { syncAllDriverSubscriptions } from './controllers/subscriptionController';

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);

        // Start Background Jobs
        console.log('⏰ Starting 10m Subscription Failsafe Sync...');
        setInterval(syncAllDriverSubscriptions, 600000); // 10 minutes
    });
}

export default app;
