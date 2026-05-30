const FormData = require('form-data');
const axios = require('axios');

async function submitDriver() {
    const form = new FormData();
    const timestamp = Date.now();
    form.append('username', `driver_${timestamp}`);
    form.append('name', 'Sample Driver Applicant');
    form.append('phone', `+260${Math.floor(100000000 + Math.random() * 900000000)}`);
    form.append('email', `driver_${timestamp}@example.com`);
    form.append('password', 'password123');
    form.append('national_id', `123456/${Math.floor(10 + Math.random() * 90)}/1`);
    form.append('drivers_license_number', `DL${Math.floor(1000000 + Math.random() * 9000000)}`);
    form.append('license_expiry_date', '2030-12-31');
    form.append('vehicle_type', 'Sedan');
    form.append('vehicle_registration_number', 'ABX 1234');
    form.append('vehicle_color', 'Silver');
    form.append('driving_experience_years', '5');

    try {
        const response = await axios.post('https://tiye-b667.onrender.com/apply-driver', form, {
            headers: form.getHeaders()
        });
        console.log('Response:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

submitDriver();
