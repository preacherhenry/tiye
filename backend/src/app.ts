import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import rideRoutes from './routes/rideRoutes';
import adminRoutes from './routes/adminRoutes';
import driverRoutes from './routes/driverRoutes';
import promotionRoutes from './routes/promotionRoutes';
import placesRoutes from './routes/placesRoutes';
// import subscriptionRoutes from './routes/subscriptionRoutes';
import settingsRoutes from './routes/settingsRoutes';
import fareRoutes from './routes/fareRoutes';
import messageRoutes from './routes/messageRoutes';
import walletRoutes from './routes/walletRoutes';
import financialSettingsRoutes from './routes/financialSettingsRoutes';
import { startCleanupJob } from './jobs/cleanupTrips';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadsPath = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}

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
app.use('/uploads', express.static(uploadsPath, corsOptions)); // Serve uploaded files with absolute path
app.use('/settings', settingsRoutes);
app.use('/', authRoutes);
app.use('/', rideRoutes);
app.use('/admin', adminRoutes);
app.use('/driver', driverRoutes);
app.use('/', promotionRoutes);
app.use('/places', placesRoutes);
// app.use('/subscriptions', subscriptionRoutes);
app.use('/fares', fareRoutes);
app.use('/messages', messageRoutes);
app.use('/wallet', walletRoutes);
app.use('/financial-settings', financialSettingsRoutes);

app.get('/', (req: Request, res: Response) => {
    // Last deploy trigger: 2026-03-09 00:40
    res.json({ status: "Taxi node backend running" });
});

import { checkLowBalanceDrivers } from './controllers/driverController';

// Start Background Jobs
console.log('⏰ Starting 1m Wallet Balance Check...');
setInterval(checkLowBalanceDrivers, 60000); // 1 minute
startCleanupJob();

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export default app;
