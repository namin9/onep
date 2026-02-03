-- [Archive Editor] 통합 데이터베이스 스키마 v2 (D1 호환성 강화)

DROP TABLE IF EXISTS User_Stats;
CREATE TABLE User_Stats (
    user_id TEXT PRIMARY KEY,
    attack_level INTEGER DEFAULT 1,
    attack_speed_level INTEGER DEFAULT 1,
    crit_chance_level INTEGER DEFAULT 1,
    crit_damage_level INTEGER DEFAULT 1,
    rubies INTEGER DEFAULT 0, -- Using INTEGER for broad compatibility
    ink INTEGER DEFAULT 0,
    highest_stage INTEGER DEFAULT 1,
    last_login_at TEXT, -- Storing as ISO 8601 string
    total_spent REAL DEFAULT 0.0,
    has_ad_free INTEGER DEFAULT 0, -- 0 for false, 1 for true
    mileage_points INTEGER DEFAULT 0,
    is_banned INTEGER DEFAULT 0, -- 0 for false, 1 for true
    s_pity_counter INTEGER DEFAULT 0,
    sss_pity_counter INTEGER DEFAULT 0,
    soul_essence INTEGER DEFAULT 0
);

DROP TABLE IF EXISTS User_Active_Sessions;
CREATE TABLE User_Active_Sessions (
    user_id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    last_seen_at TEXT -- Storing as ISO 8601 string
);

DROP TABLE IF EXISTS Skins;
CREATE TABLE Skins (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    grade TEXT NOT NULL,
    source_novel TEXT NOT NULL,
    base_effect_type TEXT NOT NULL,
    base_effect_value REAL NOT NULL,
    set_id INTEGER,
    UNIQUE(name, source_novel)
);

DROP TABLE IF EXISTS User_Skins;
CREATE TABLE User_Skins (
    instance_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    skin_id INTEGER NOT NULL,
    is_equipped INTEGER DEFAULT 0, -- 0 for false, 1 for true
    level INTEGER DEFAULT 1
);

DROP TABLE IF EXISTS User_Skin_Options;
CREATE TABLE User_Skin_Options (
    skin_instance_id TEXT NOT NULL,
    option_type TEXT NOT NULL,
    option_value REAL NOT NULL
);

-- ... (다른 테이블들도 필요에 따라 유사하게 수정될 수 있습니다) ...
-- For now, we focus on the tables used by the login logic.

-- Layer 3: The Library - Monster Codex System
DROP TABLE IF EXISTS Monsters;
CREATE TABLE Monsters (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    required_fragments INTEGER NOT NULL DEFAULT 100
);

DROP TABLE IF EXISTS User_Monster_Fragments;
CREATE TABLE User_Monster_Fragments (
    user_id TEXT NOT NULL,
    monster_id INTEGER NOT NULL,
    collected_fragments INTEGER NOT NULL DEFAULT 0,
    is_completed INTEGER NOT NULL DEFAULT 0, -- 0 for false, 1 for true
    PRIMARY KEY (user_id, monster_id),
    FOREIGN KEY (user_id) REFERENCES User_Stats(user_id) ON DELETE CASCADE,
    FOREIGN KEY (monster_id) REFERENCES Monsters(id) ON DELETE CASCADE
);

-- Layer 4: The Soul - Prestige/Talent System
DROP TABLE IF EXISTS Talents;
CREATE TABLE Talents (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    cost INTEGER NOT NULL DEFAULT 0,
    prerequisite_talent_id INTEGER,
    effect_type TEXT NOT NULL,
    effect_value REAL NOT NULL,
    FOREIGN KEY (prerequisite_talent_id) REFERENCES Talents(id) ON DELETE SET NULL
);

DROP TABLE IF EXISTS User_Talents;
CREATE TABLE User_Talents (
    user_id TEXT NOT NULL,
    talent_id INTEGER NOT NULL,
    unlocked_at TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, talent_id),
    FOREIGN KEY (user_id) REFERENCES User_Stats(user_id) ON DELETE CASCADE,
    FOREIGN KEY (talent_id) REFERENCES Talents(id) ON DELETE CASCADE
);


