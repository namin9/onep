// --- State & Config ---
const state = {
    jwt: null,
    user: null,
    game_config: null,
    library_codex: [],
    soul_talents: {
        all_talents: [],
        unlocked_talent_ids: []
    }
};

// Use the local wrangler dev server URL by default.
const API_BASE_URL = 'http://127.0.0.1:8787';

// --- DOM Elements ---
const DOMElements = {
    jwtDisplay: document.getElementById('jwt-display'),
    responseOutput: document.getElementById('response-output'),
    userStatsDisplay: document.getElementById('user-stats-display'),
    gachaResults: document.getElementById('gacha-results'),
    libraryCodexDisplay: document.getElementById('library-codex-display'),
    soulTalentsDisplay: document.getElementById('soul-talents-display'),

    loginBtn: document.getElementById('loginBtn'),
    progressBtn: document.getElementById('progressBtn'),
    upgradeStatBtn: document.getElementById('upgradeStatBtn'),
    statToUpgradeSelect: document.getElementById('stat-to-upgrade'),
    gachaPullBtn1x: document.getElementById('gachaPullBtn1x'),
    gachaPullBtn10x: document.getElementById('gachaPullBtn10x'),

    // Library
    getCodexBtn: document.getElementById('getCodexBtn'),
    submitMonsterId: document.getElementById('submitMonsterId'),
    submitFragmentsAmount: document.getElementById('submitFragmentsAmount'),
    submitFragmentsBtn: document.getElementById('submitFragmentsBtn'),

    // Soul
    rebirthBtn: document.getElementById('rebirthBtn'),
    unlockTalentId: document.getElementById('unlockTalentId'),
    unlockTalentBtn: document.getElementById('unlockTalentBtn'),
    getTalentsBtn: document.getElementById('getTalentsBtn'),
};

// --- UI Rendering ---

function displayResponse(data) {
    DOMElements.responseOutput.textContent = JSON.stringify(data, null, 2);
}

function renderUserStats() {
    if (!state.user) {
        DOMElements.userStatsDisplay.innerHTML = '<p>Login to see your stats.</p>';
        return;
    }
    const { stats } = state.user;
    DOMElements.userStatsDisplay.innerHTML = `
        <div class="stat-grid">
            <div class="stat-item">Rubies: <strong>${stats.rubies}</strong></div>
            <div class="stat-item">Ink: <strong>${stats.ink}</strong></div>
            <div class="stat-item">Mileage: <strong>${stats.mileage_points}</strong></div>
            <div class="stat-item">Soul Essence: <strong>${stats.soul_essence}</strong></div>
            <div class="stat-item">Highest Stage: <strong>${stats.highest_stage}</strong></div>
            <div class="stat-item">Attack Lvl: <strong>${stats.attack_level}</strong></div>
            <div class="stat-item">Atk Speed Lvl: <strong>${stats.attack_speed_level}</strong></div>
            <div class="stat-item">Crit Chance Lvl: <strong>${stats.crit_chance_level}</strong></div>
            <div class="stat-item">Crit Damage Lvl: <strong>${stats.crit_damage_level}</strong></div>
        </div>
    `;
}

function renderGachaResults(skins) {
     DOMElements.gachaResults.innerHTML = skins.map(skin => `
        <div class="gacha-item">
            <div class="grade-${skin.grade}"><strong>Grade: ${skin.grade}</strong> (ID: ${skin.id})</div>
            <div>Instance ID: ${skin.instance_id.substring(0, 8)}...</div>
            ${skin.options.map(opt => `<div>${opt.option_type}: ${opt.option_value.toFixed(2)}</div>`).join('')}
        </div>
    `).join('');
}

function renderLibraryCodex(codex) {
    if (!codex || codex.length === 0) {
        DOMElements.libraryCodexDisplay.innerHTML = '<p>No monsters in codex yet.</p>';
        return;
    }
    DOMElements.libraryCodexDisplay.innerHTML = codex.map(monster => `
        <div class="codex-item" style="border-bottom: 1px dashed #eee; padding: 5px 0;">
            <strong>${monster.monster_name} (ID: ${monster.monster_id})</strong>:
            ${monster.collected_fragments}/${monster.required_fragments} fragments 
            (${monster.is_completed ? 'Completed' : 'In Progress'})
        </div>
    `).join('');
}

function renderSoulTalentTree(talentsData) {
    if (!talentsData || talentsData.all_talents.length === 0) {
        DOMElements.soulTalentsDisplay.innerHTML = '<p>No talents defined yet.</p>';
        return;
    }
    const { all_talents, unlocked_talent_ids } = talentsData;
    DOMElements.soulTalentsDisplay.innerHTML = all_talents.map(talent => `
        <div class="talent-item" style="border-bottom: 1px dashed #eee; padding: 5px 0; ${unlocked_talent_ids.includes(talent.id) ? 'background-color: #e6ffed;' : ''}">
            <strong>${talent.name} (ID: ${talent.id})</strong> - Cost: ${talent.cost} Essence<br>
            ${talent.description} [${talent.effect_type}: ${talent.effect_value}]
            ${talent.prerequisite_talent_id ? `(Requires: Talent ${talent.prerequisite_talent_id})` : ''}
            ${unlocked_talent_ids.includes(talent.id) ? '<strong>(UNLOCKED)</strong>' : ''}
        </div>
    `).join('');
}


function updateButtonState() {
    const loggedIn = !!state.jwt;
    DOMElements.upgradeStatBtn.disabled = !loggedIn;
    DOMElements.gachaPullBtn1x.disabled = !loggedIn;
    DOMElements.gachaPullBtn10x.disabled = !loggedIn;
    DOMElements.progressBtn.disabled = !loggedIn;
    DOMElements.getCodexBtn.disabled = !loggedIn;
    DOMElements.submitFragmentsBtn.disabled = !loggedIn;
    DOMElements.rebirthBtn.disabled = !loggedIn;
    DOMElements.unlockTalentBtn.disabled = !loggedIn;
    DOMElements.getTalentsBtn.disabled = !loggedIn;
}

// --- API Call Logic ---

async function callApi(endpoint, method = 'POST', body) {
    if (!state.jwt) {
        alert('Please login first!');
        throw new Error("Not authenticated");
    }
    displayResponse(`Calling ${method} ${endpoint}...`);
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.jwt}`
            },
            body: body ? JSON.stringify(body) : undefined,
        });
        const data = await response.json();
        displayResponse(data);
        if (!response.ok) {
           throw new Error(data.message || 'API call failed');
        }
        return data;
    } catch (error) {
        displayResponse({ status: 'error', message: error.message });
        throw error;
    }
}

async function handleLogin() {
    displayResponse('Logging in...');
    try {
        const response = await fetch(`${API_BASE_URL}/api/user/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                server_auth_code: 'valid_google_code', // Using the mock code
                client_version: '1.0.0'
            })
        });
        const data = await response.json();
        displayResponse(data);

        if (data.status === 'success' && data.jwt) {
            state.jwt = data.jwt;
            state.user = data.user_data;
            state.game_config = data.game_config;
            DOMElements.jwtDisplay.value = state.jwt;
            renderUserStats();
            updateButtonState();
            // Automatically fetch other data after login
            handleGetCodex();
            handleGetTalentTree();
        }
    } catch (error) {
        displayResponse({ status: 'error', message: error.message });
    }
}

async function handleProgress() {
    try {
        const data = await callApi('/api/game/progress', 'POST', {
            client_highest_stage: state.user?.stats.highest_stage || 1
        });
        if (data.status === 'success') {
            state.user.stats.rubies = data.updated_stats.rubies;
            state.user.stats.highest_stage = data.updated_stats.highest_stage;
            renderUserStats();
        }
    } catch (e) { /* Error already displayed by callApi */ }
}

async function handleUpgradeStat() {
    const stat_type = DOMElements.statToUpgradeSelect.value;
    try {
        const data = await callApi('/api/user/upgrade_stat', 'POST', {
            stat_type: stat_type,
            upgrade_amount: 1
        });
        if (data.status === 'success') {
            state.user.stats.rubies = data.updated_stats.rubies;
            state.user.stats[stat_type] = data.updated_stats[stat_type];
            renderUserStats();
        }
    } catch (e) { /* Error already displayed by callApi */ }
}

async function handleGachaPull(pull_count) {
    DOMElements.gachaResults.innerHTML = 'Pulling...';
    try {
        const data = await callApi('/api/gacha/pull', 'POST', { pull_count });
        if (data.status === 'success') {
            state.user.stats.ink = data.updated_stats.ink;
            state.user.stats.mileage_points = data.updated_stats.mileage_points;
            renderUserStats();
            renderGachaResults(data.obtained_skins);
        }
    } catch (e) {
        DOMElements.gachaResults.innerHTML = 'An error occurred.';
    }
}

// --- Library Handlers ---
async function handleGetCodex() {
    DOMElements.libraryCodexDisplay.innerHTML = 'Loading codex...';
    try {
        const data = await callApi('/api/library/codex', 'GET');
        if (data.status === 'success') {
            state.library_codex = data.codex;
            renderLibraryCodex(data.codex);
        }
    } catch (e) {
        DOMElements.libraryCodexDisplay.innerHTML = 'An error occurred loading codex.';
    }
}

async function handleSubmitFragments() {
    const monster_id = parseInt(DOMElements.submitMonsterId.value);
    const fragments_to_add = parseInt(DOMElements.submitFragmentsAmount.value);
    if (isNaN(monster_id) || isNaN(fragments_to_add)) {
        alert('Please enter valid numbers for Monster ID and Fragments.');
        return;
    }
    try {
        const data = await callApi('/api/library/submit_fragments', 'POST', { monster_id, fragments_to_add });
        if (data.status === 'success') {
            alert(`Added ${data.fragments_added} fragments to Monster ${data.monster_id}. Collected: ${data.collected_fragments}/${data.required_fragments}`);
            handleGetCodex(); // Refresh codex display
        }
    } catch (e) { /* Error already displayed by callApi */ }
}

// --- Soul Handlers ---
async function handleRebirth() {
    if (!confirm('Are you sure you want to Rebirth? This will reset some of your progress.')) {
        return;
    }
    try {
        const data = await callApi('/api/soul/rebirth', 'POST');
        if (data.status === 'success') {
            alert(`Rebirth successful! Gained ${data.gained_soul_essence} Soul Essence.`);
            // After rebirth, user stats are reset, so re-login or refresh full state
            handleLogin(); // Best way to refresh all user-related state
        }
    } catch (e) { /* Error already displayed by callApi */ }
}

async function handleUnlockTalent() {
    const talent_id = parseInt(DOMElements.unlockTalentId.value);
    if (isNaN(talent_id)) {
        alert('Please enter a valid Talent ID.');
        return;
    }
    try {
        const data = await callApi('/api/soul/unlock_talent', 'POST', { talent_id });
        if (data.status === 'success') {
            alert(`Talent ${data.talent_id} unlocked! Remaining Soul Essence: ${data.remaining_soul_essence}`);
            handleLogin(); // Refresh all state including user stats and talent tree
        }
    } catch (e) { /* Error already displayed by callApi */ }
}

async function handleGetTalentTree() {
    DOMElements.soulTalentsDisplay.innerHTML = 'Loading talent tree...';
    try {
        const data = await callApi('/api/soul/talents', 'GET');
        if (data.status === 'success') {
            state.soul_talents.all_talents = data.all_talents;
            state.soul_talents.unlocked_talent_ids = data.unlocked_talent_ids;
            renderSoulTalentTree(state.soul_talents);
        }
    } catch (e) {
        DOMElements.soulTalentsDisplay.innerHTML = 'An error occurred loading talent tree.';
    }
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    DOMElements.loginBtn.addEventListener('click', handleLogin);
    DOMElements.progressBtn.addEventListener('click', handleProgress);
    DOMElements.upgradeStatBtn.addEventListener('click', handleUpgradeStat);
    DOMElements.gachaPullBtn1x.addEventListener('click', () => handleGachaPull(1));
    DOMElements.gachaPullBtn10x.addEventListener('click', () => handleGachaPull(10));
    
    // Library
    DOMElements.getCodexBtn.addEventListener('click', handleGetCodex);
    DOMElements.submitFragmentsBtn.addEventListener('click', handleSubmitFragments);

    // Soul
    DOMElements.rebirthBtn.addEventListener('click', handleRebirth);
    DOMElements.unlockTalentBtn.addEventListener('click', handleUnlockTalent);
    DOMElements.getTalentsBtn.addEventListener('click', handleGetTalentTree);

    renderUserStats(); // Initial render for "Login to see your stats."
    updateButtonState();
});