import axios from 'axios';

async function testSignup() {
    try {
        const response = await axios.post('http://localhost:3001/api/signup', {
            name: "Test User",
            email: "test_" + Math.random().toString(36).substring(7) + "@example.com",
            password: "password123",
            role: "PARENT"
        });
        console.log('Success:', response.data);
    } catch (error: any) {
        console.error('Error:', error.response?.data || error.message);
    }
}

testSignup();
