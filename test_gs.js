const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwl493XRAeWi7vGBCfXyQ4lkhWRnN1LDQiamCgVlZHQ-mNwkTSLrLUPMxQ7xan4QRMyPQ/exec";

async function testGS() {
    try {
        console.log("Testing GET...");
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?sheet=Orders`);
        const text = await response.text();
        console.log("GET Response:", text);

        console.log("Testing POST...");
        const payload = {
            action: 'append',
            data: ["Test", "Data", new Date().toISOString()]
        };
        const postResponse = await fetch(`${GOOGLE_SCRIPT_URL}?sheet=Orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(payload)
        });
        const postText = await postResponse.text();
        console.log("POST Response:", postText);
    } catch (e) {
        console.error("Error:", e);
    }
}

testGS();
