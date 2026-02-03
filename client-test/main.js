// --- Configuration ---
const getWorkerUrl = () => document.getElementById('workerUrl').value.trim();
const responseOutput = document.getElementById('response-output');
const jwtDisplay = document.getElementById('jwt-display');

let jwtToken = null; // Variable to store the JWT

// --- UI Helper ---
function displayResponse(data) {
    responseOutput.textContent = JSON.stringify(data, null, 2);
}

// --- API Call Functions ---

// 1. Login
async function login() {
    const workerUrl = getWorkerUrl();
    if (!workerUrl) {
        alert('Please enter your Worker URL first.');
        return;
    }

    displayResponse('Logging in...');
    try {
        const response = await fetch(`${workerUrl}/api/user/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                server_auth_code: 'valid_google_code', // Using the mock code from our backend
                client_version: '1.0.0'
            })
        });
        const data = await response.json();
        displayResponse(data);

        if (data.status === 'success' && data.jwt) {
            jwtToken = data.jwt;
            jwtDisplay.value = jwtToken;
        }
    } catch (error) {
        displayResponse({ status: 'error', message: error.message });
    }
}

// 2. Generic Authenticated API Call
async function callAuthenticatedApi(endpoint, method = 'POST', body = {}) {
    const workerUrl = getWorkerUrl();
    if (!jwtToken || !workerUrl) {
        alert('Please login first to get a JWT.');
        return;
    }

    displayResponse(`Calling ${endpoint}...`);
    try {
        const response = await fetch(`${workerUrl}${endpoint}`, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtToken}`
            },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        displayResponse(data);
    } catch (error) {
        displayResponse({ status: 'error', message: error.message });
    }
}

// --- Event Listeners ---
document.getElementById('loginBtn').addEventListener('click', login);

document.getElementById('upgradeStatBtn').addEventListener('click', () => {
    callAuthenticatedApi('/api/user/upgrade_stat', 'POST', {
        stat_type: 'attack_level',
        upgrade_amount: 1
    });
});

document.getElementById('gachaPullBtn').addEventListener('click', () => {
    callAuthenticatedApi('/api/gacha/pull', 'POST', {
        pull_count: 10
    });
});

// Set default worker URL for convenience (user can change it)
document.getElementById('workerUrl').value = 'https://onep.YOUR_PAGES_PROJECT.pages.dev';

