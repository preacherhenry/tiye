
import { db } from '../src/config/firebase'; // Use shared config
import { Request, Response } from 'express';
import { getTripDetails } from '../src/controllers/adminController';

const simulateTripDetails = async () => {
    console.log('🔍 Finding a trip to simulate...');

    try {
        const snapshot = await db.collection('rides').limit(1).get();
        if (snapshot.empty) {
            console.log('❌ No trips found in database (rides collection).');
            return;
        }

        const tripId = snapshot.docs[0].id;
        console.log(`✅ Found Trip ID: ${tripId}`);
        console.log('   Raw Data:', snapshot.docs[0].data());

        // Simulate Controller Call
        const mockReq = {
            params: { id: tripId },
            protocol: 'http',
            get: (header: string) => ''
        } as unknown as Request;

        const mockRes = {
            json: (data: any) => {
                console.log('------------------------------------------------');
                console.log('🚀 Controller Response:');
                console.log(JSON.stringify(data, null, 2));
            },
            status: (code: number) => {
                console.log(`Response Status: ${code}`);
                return mockRes;
            }
        } as unknown as Response;

        console.log('👉 Calling getTripDetails...');
        await getTripDetails(mockReq, mockRes);

    } catch (error) {
        console.error('Simulation failed:', error);
    }
    process.exit();
};

simulateTripDetails();
