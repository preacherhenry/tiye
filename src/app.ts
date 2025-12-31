import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import rideRoutes from './routes/rideRoutes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/uploads', express.static('uploads')); // Serve uploaded files
app.use('/', authRoutes);
app.use('/', rideRoutes);

app.get('/', (req: Request, res: Response) => {
    res.json({ status: "Taxi node backend running" });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export default app;
