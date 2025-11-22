
// const fetch = require('node-fetch'); // Native fetch is available in Node 18+

async function testApi() {
    try {
        console.log('Testing /api/generate-recommendations...');
        const response = await fetch('http://localhost:3000/api/generate-recommendations?academicStream=CS&skills=JS&interests=AI', {
            method: 'GET' // Explicitly GET
        });
        console.log(`Status: ${response.status}`);
        if (response.ok) {
            const text = await response.text();
            console.log('Response:', text.substring(0, 100) + '...');
        } else {
            console.log('Error text:', await response.text());
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testApi();
