// --- Configuration & State ---
const API_BASE_URL = 'https://onep.koolee1372-73d.workers.dev'; // Default for wrangler dev
const gameState = {
    jwt: null,
    user: null,
    gameConfig: null,
    libraryCodex: [],
    soulTalents: {
        allTalents: [],
        unlockedTalentIds: []
    },
    // For client-side idle calculations
    lastTickTime: Date.now(),
    rubiesPerSec: 0,
    gameLoopInterval: null,
};

// --- DOM Element References ---
const DOM = {
    loginScreen: document.getElementById('login-screen'),
    gameScreen: document.getElementById('game-screen'),
    loginBtn: document.getElementById('loginBtn'),
    loginStatus: document.getElementById('login-status'),
    
    playerStats: document.getElementById('player-stats'),
    mainDisplay: document.getElementById('main-display'),
    currentStage: document.getElementById('current-stage'),
    currentRubies: document.getElementById('current-rubies'),
    rubiesPerSecDisplay: document.getElementById('rubies-per-sec'),
    currentInk: document.getElementById('current-ink'),
    currentSoulEssence: document.getElementById('current-soul-essence'),
    gameMessages: document.getElementById('game-messages'),

    rebirthBtn: document.getElementById('rebirthBtn'),
    progressBtn: document.getElementById('progressBtn'),

    upgradesSection: document.getElementById('upgrades-section'),
    upgradeList: document.getElementById('upgrade-list'),

    gachaSection: document.getElementById('gacha-section'),
    gachaPullBtn1x: document.getElementById('gachaPullBtn1x'),
    gachaPullBtn10x: document.getElementById('gachaPullBtn10x'),
    gachaResultsDisplay: document.getElementById('gacha-results-display'),

    librarySection: document.getElementById('library-section'),
    refreshCodexBtn: document.getElementById('refreshCodexBtn'),
    libraryCodexDisplay: document.getElementById('library-codex-display'),

    soulSection: document.getElementById('soul-section'),
    refreshTalentsBtn: document.getElementById('refreshTalentsBtn'),
    soulTalentsDisplay: document.getElementById('soul-talents-display'),
};

// --- Utility Functions ---
function showGameSection(sectionId) {
    DOM.loginScreen.classList.add('hidden');
    DOM.gameScreen.classList.add('hidden');
    document.getElementById(sectionId).classList.remove('hidden');
}

function showStatusMessage(message, type = 'success') {
    const msgElement = document.createElement('div');
    msgElement.textContent = message;
    msgElement.classList.add('status-message', type);
    DOM.gameMessages.appendChild(msgElement);
    setTimeout(() => msgElement.remove(), 5000); // Remove after 5 seconds
}

function calculateStatCost(currentLevel, baseCost, growthRate) {
    // Simplified cost calculation, matches backend
    return Math.floor(baseCost * Math.pow(growthRate, currentLevel - 1));
}


// --- API Interaction ---
async function callApi(endpoint, method = 'GET', body = null) {
    try {
        const headers = { 'Content-Type': 'application/json' };
        if (gameState.jwt) {
            headers['Authorization'] = `Bearer ${gameState.jwt}`;
        }
        
        const options = {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        };

        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `API Error: ${response.status}`);
        }
        return data;
    } catch (error) {
        console.error(`API call to ${endpoint} failed:`, error);
        showStatusMessage(`Error: ${error.message}`, 'error');
        throw error; // Re-throw to allow specific error handling in callers
    }
}

// --- UI Rendering Functions ---
function renderPlayerStats() {
    if (!gameState.user) return;
    const stats = gameState.user.stats;
    DOM.playerStats.innerHTML = `
        <p>Rubies: <strong>${stats.rubies}</strong></p>
        <p>Ink: <strong>${stats.ink}</strong></p>
        <p>Soul Essence: <strong>${stats.soul_essence}</strong></p>
        <p>Highest Stage: <strong>${stats.highest_stage}</strong></p>
        <p>Attack Lvl: <strong>${stats.attack_level}</strong></p>
        <p>Atk Speed Lvl: <strong>${stats.attack_speed_level}</strong></p>
        <p>Crit Chance Lvl: <strong>${stats.crit_chance_level}</strong></p>
        <p>Crit Damage Lvl: <strong>${stats.crit_damage_level}</strong></p>
    `;
}

function renderMainDisplay() {
    if (!gameState.user) return;
    const stats = gameState.user.stats;
    DOM.currentStage.textContent = stats.highest_stage;
    DOM.currentRubies.textContent = stats.rubies;
    DOM.currentInk.textContent = stats.ink;
    DOM.currentSoulEssence.textContent = stats.soul_essence;
    // Update rubies per sec based on current stats/config
    const baseRubiesPerSecPerStage = gameState.gameConfig?.base_config?.rubies_per_second_per_stage || 0.1;
    gameState.rubiesPerSec = (baseRubiesPerSecPerStage * stats.highest_stage);
    DOM.rubiesPerSecDisplay.textContent = `+${gameState.rubiesPerSec.toFixed(1)}/s`;
}

function renderUpgrades() {
    if (!gameState.user || !gameState.gameConfig?.stat_costs) return;
    DOM.upgradeList.innerHTML = ''; // Clear previous
    const stats = gameState.user.stats;
    const statCosts = gameState.gameConfig.stat_costs;

    for (const statType of Object.keys(statCosts)) {
        const currentLevel = stats[statType];
        const costConfig = statCosts[statType];
        const nextCost = calculateStatCost(currentLevel + 1, costConfig.base_cost, costConfig.growth_rate);
        
        const upgradeItem = document.createElement('div');
        upgradeItem.classList.add('upgrade-item');
        upgradeItem.innerHTML = `
            <p>${statType.replace('_level', '').replace('_', ' ')} Lvl: <strong>${currentLevel}</strong></p>
            <p>Next cost: <strong>${nextCost}</strong> Rubies</p>
            <button data-stat="${statType}" data-cost="${nextCost}" ${stats.rubies < nextCost ? 'disabled' : ''}>Upgrade</button>
        `;
        upgradeItem.querySelector('button').addEventListener('click', handleUpgradeStat);
        DOM.upgradeList.appendChild(upgradeItem);
    }
}

function renderGachaResults(skins) {
    if (!skins || skins.length === 0) {
        DOM.gachaResultsDisplay.innerHTML = '<p>No skins obtained from last pull.</p>';
        return;
    }
    DOM.gachaResultsDisplay.innerHTML = skins.map(skin => `
        <div class="gacha-item">
            <div class="grade-${skin.grade}"><strong>Grade: ${skin.grade}</strong> (ID: ${skin.id})</div>
            <div>Instance ID: ${skin.instance_id.substring(0, 8)}...</div>
            ${skin.options.map(opt => `<div>${opt.option_type}: ${opt.option_value.toFixed(2)}</div>`).join('')}
        </div>
    `).join('');
}

function renderLibraryCodex() {
    if (!gameState.libraryCodex || gameState.libraryCodex.length === 0) {
        DOM.libraryCodexDisplay.innerHTML = '<p>No monsters in codex yet.</p>';
        return;
    }
    DOM.libraryCodexDisplay.innerHTML = gameState.libraryCodex.map(monster => `
        <div class="codex-item ${monster.is_completed ? 'completed' : ''}">
            <strong>${monster.monster_name} (ID: ${monster.monster_id})</strong>:
            ${monster.collected_fragments}/${monster.required_fragments} fragments 
            (${monster.is_completed ? 'Completed' : 'In Progress'})
        </div>
    `).join('');
}

function renderSoulTalents() {
    if (!gameState.soulTalents.allTalents || gameState.soulTalents.allTalents.length === 0) {
        DOM.soulTalentsDisplay.innerHTML = '<p>No talents defined yet.</p>';
        return;
    }
    const { allTalents, unlockedTalentIds } = gameState.soulTalents;
    DOM.soulTalentsDisplay.innerHTML = allTalents.map(talent => `
        <div class="talent-item ${unlockedTalentIds.includes(talent.id) ? 'unlocked' : ''}">
            <strong>${talent.name} (ID: ${talent.id})</strong> - Cost: ${talent.cost} Essence<br>
            ${talent.description} [${talent.effect_type}: ${talent.effect_value}]
            ${talent.prerequisite_talent_id ? `(Requires: Talent ${talent.prerequisite_talent_id})` : ''}
            ${unlockedTalentIds.includes(talent.id) ? '<strong>(UNLOCKED)</strong>' : ''}
        </div>
    `).join('');
}


// --- Game Logic Functions ---
async function login() {
    DOM.loginStatus.textContent = 'Logging in...';
    try {
        const data = await callApi('/api/user/login', 'POST', {
            server_auth_code: 'valid_google_code', // Mock code
            client_version: '1.0.0'
        });
        
        gameState.jwt = data.jwt;
        gameState.user = data.user_data;
        gameState.gameConfig = data.game_config;
        
        DOM.loginStatus.textContent = 'Login successful!';
        showGameSection('game-screen');
        
        // Initial renders
        renderAllGameUI();
        startClientGameLoop();
        
        // Fetch other game data immediately after login
        await handleRefreshCodex();
        await handleRefreshTalents();

    } catch (error) {
        DOM.loginStatus.textContent = `Login failed: ${error.message}`;
    }
}

function renderAllGameUI() {
    renderPlayerStats();
    renderMainDisplay();
    renderUpgrades();
    // renderGachaResults(); // Not needed on initial load
    renderLibraryCodex();
    renderSoulTalents();
}

function startClientGameLoop() {
    if (gameState.gameLoopInterval) {
        clearInterval(gameState.gameLoopInterval);
    }
    gameState.gameLoopInterval = setInterval(() => {
        const now = Date.now();
        const deltaTime = (now - gameState.lastTickTime) / 1000; // in seconds
        gameState.lastTickTime = now;

        // Simulate ruby gain (purely client-side visual for now)
        if (gameState.user) {
            gameState.user.stats.rubies += gameState.rubiesPerSec * deltaTime;
            DOM.currentRubies.textContent = Math.floor(gameState.user.stats.rubies);
        }

        // Periodically sync progress with server
        if (Math.floor(now / 1000) % 5 === 0) { // Every 5 seconds
            handleProgress();
        }
    }, 1000); // Update every second
}

async function handleProgress() {
    try {
        const data = await callApi('/api/game/progress', 'POST', {
            client_highest_stage: gameState.user?.stats.highest_stage || 1
        });
        if (data.status === 'success') {
            gameState.user.stats.rubies = data.updated_stats.rubies;
            gameState.user.stats.highest_stage = data.updated_stats.highest_stage;
            renderAllGameUI();
            showStatusMessage('Idle rewards collected!');
        }
    } catch (e) { /* Error already handled by callApi */ }
}

async function handleRebirth() {
    if (!confirm('Are you sure you want to Rebirth? This will reset some of your progress and give you Soul Essence.')) {
        return;
    }
    try {
        const data = await callApi('/api/soul/rebirth', 'POST');
        if (data.status === 'success') {
            showStatusMessage(`Rebirth successful! Gained ${data.gained_soul_essence} Soul Essence.`);
            // After rebirth, user stats are reset, so re-login to fetch fresh state
            login(); 
        }
    } catch (e) { /* Error already handled by callApi */ }
}

async function handleUpgradeStat(event) {
    const statType = event.target.dataset.stat;
    const cost = parseInt(event.target.dataset.cost);

    if (gameState.user.stats.rubies < cost) {
        showStatusMessage('Not enough Rubies!', 'error');
        return;
    }
    try {
        const data = await callApi('/api/user/upgrade_stat', 'POST', {
            stat_type: statType,
            upgrade_amount: 1
        });
        if (data.status === 'success') {
            gameState.user.stats.rubies = data.updated_stats.rubies;
            gameState.user.stats[statType] = data.updated_stats[statType];
            renderAllGameUI();
            showStatusMessage(`${statType.replace('_level', '').replace('_', ' ')} upgraded!`);
        }
    } catch (e) { /* Error already handled by callApi */ }
}

async function handleGachaPull(pullCount) {
    DOM.gachaResultsDisplay.innerHTML = '<p>Pulling...</p>';
    try {
        const data = await callApi('/api/gacha/pull', 'POST', { pull_count: pullCount });
        if (data.status === 'success') {
            gameState.user.stats.ink = data.updated_stats.ink;
            gameState.user.stats.mileage_points = data.updated_stats.mileage_points;
            renderAllGameUI();
            renderGachaResults(data.obtained_skins);
            showStatusMessage(`Pulled ${pullCount} item(s)!`);
        }
    } catch (e) {
        DOM.gachaResultsDisplay.innerHTML = '<p>An error occurred during pull.</p>';
    }
}

async function handleRefreshCodex() {
    DOM.libraryCodexDisplay.innerHTML = '<p>Loading codex...</p>';
    try {
        const data = await callApi('/api/library/codex', 'GET');
        if (data.status === 'success') {
            gameState.libraryCodex = data.codex;
            renderLibraryCodex();
            showStatusMessage('Codex refreshed!');
        }
    } catch (e) {
        DOM.libraryCodexDisplay.innerHTML = '<p>Failed to load codex.</p>';
    }
}

async function handleSubmitFragments() {
    const monsterId = parseInt(prompt('Enter Monster ID to add fragments:'));
    if (isNaN(monsterId)) {
        showStatusMessage('Invalid Monster ID.', 'error');
        return;
    }
    const fragmentsToAdd = parseInt(prompt('Enter number of fragments to add:'));
    if (isNaN(fragmentsToAdd) || fragmentsToAdd <= 0) {
        showStatusMessage('Invalid fragment amount.', 'error');
        return;
    }

    try {
        const data = await callApi('/api/library/submit_fragments', 'POST', { monster_id: monsterId, fragments_to_add: fragmentsToAdd });
        if (data.status === 'success') {
            showStatusMessage(`Added ${data.fragments_added} fragments to Monster ${data.monster_id}.`);
            handleRefreshCodex(); // Refresh codex display
        }
    } catch (e) { /* Error already handled by callApi */ }
}

async function handleRefreshTalents() {
    DOM.soulTalentsDisplay.innerHTML = '<p>Loading talents...</p>';
    try {
        const data = await callApi('/api/soul/talents', 'GET');
        if (data.status === 'success') {
            gameState.soulTalents.allTalents = data.all_talents;
            gameState.soulTalents.unlockedTalentIds = data.unlocked_talent_ids;
            renderSoulTalents();
            showStatusMessage('Talent tree refreshed!');
        }
    } catch (e) {
        DOM.soulTalentsDisplay.innerHTML = '<p>Failed to load talent tree.</p>';
    }
}

async function handleUnlockTalent() {
    const talentId = parseInt(prompt('Enter Talent ID to unlock:'));
    if (isNaN(talentId)) {
        showStatusMessage('Invalid Talent ID.', 'error');
        return;
    }
    try {
        const data = await callApi('/api/soul/unlock_talent', 'POST', { talent_id: talentId });
        if (data.status === 'success') {
            showStatusMessage(`Talent ${data.talent_id} unlocked!`);
            handleRefreshTalents(); // Refresh talent display
            // Also update player stats if soul essence changed
            handleLogin(); // To get updated soul essence from server
        }
    } catch (e) { /* Error already handled by callApi */ }
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    DOM.loginBtn.addEventListener('click', login);
    DOM.rebirthBtn.addEventListener('click', handleRebirth);
    DOM.progressBtn.addEventListener('click', handleProgress);
    DOM.gachaPullBtn1x.addEventListener('click', () => handleGachaPull(1));
    DOM.gachaPullBtn10x.addEventListener('click', () => handleGachaPull(10));
    DOM.refreshCodexBtn.addEventListener('click', handleRefreshCodex);
    DOM.libraryCodexDisplay.addEventListener('click', (e) => { // Delegate fragment submission from codex display
        if (e.target.tagName === 'BUTTON' && e.target.classList.contains('submit-fragment-btn')) {
            handleSubmitFragments(e.target.dataset.monsterId);
        }
    });
    DOM.refreshTalentsBtn.addEventListener('click', handleRefreshTalents);
    
    // Delegate upgrade stat button clicks
    DOM.upgradeList.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' && e.target.dataset.stat) {
            handleUpgradeStat(e);
        }
    });

    // Delegate unlock talent button clicks
    DOM.soulTalentsDisplay.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' && e.target.classList.contains('unlock-talent-btn')) {
            handleUnlockTalent(e.target.dataset.talentId);
        }
    });

    showGameSection('login-screen'); // Start on login screen
});
