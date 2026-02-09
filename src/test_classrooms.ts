async function testClassrooms() {
    const schoolId = 'a2643e31-5cfc-4b7d-9a8a-60a2cdc63f3f';
    try {
        console.log('Fetching classrooms...');
        const response = await fetch(`http://localhost:3001/api/classrooms?schoolId=${schoolId}`);
        if (!response.ok) {
            console.error('Response NOT OK:', response.status);
        }
        const text = await response.text();
        console.log('Response body (start):', text.substring(0, 100));
    } catch (error) {
        console.error('Fetch Error:', error);
    }
}

testClassrooms();
