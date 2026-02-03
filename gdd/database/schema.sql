-- [Archive Editor] 통합 데이터베이스 스키마 (Cloudflare D1 기준)

-- Layer 1: Foundation (기초 스탯 및 유저 진행 상황)
CREATE TABLE User_Stats (
    user_id INTEGER PRIMARY KEY,
    attack_level INTEGER DEFAULT 1,
    attack_speed_level INTEGER DEFAULT 1,
    crit_chance_level INTEGER DEFAULT 1,
    crit_damage_level INTEGER DEFAULT 1,
    rubies BIGINT DEFAULT 0,
    highest_stage INTEGER DEFAULT 1
);

-- Layer 2: Armory (스킨 마스터 테이블)
CREATE TABLE Skins (
    id INTEGER PRIMARY KEY,              -- 스킨 고유 ID
    name TEXT NOT NULL,                  -- 스킨 이름 (예: "오염된 문주")
    grade TEXT NOT NULL,                 -- 등급 (C, B, A, S, SS, SSS)
    source_novel TEXT NOT NULL,          -- 출전 소설 (예: "재벌집 막내 편집자")
    base_effect_type TEXT NOT NULL,      -- 기본 보유 효과 타입 (예: "ATTACK_POWER_PERCENT")
    base_effect_value REAL NOT NULL,     -- 기본 보유 효과 값 (예: 0.1은 10% 증가를 의미)
    set_id INTEGER,                      -- 세트 ID (세트 효과를 위해)
    UNIQUE(name, source_novel)
);

-- Layer 2: Armory (유저가 소유한 스킨 인스턴스)
CREATE TABLE User_Skins (
    user_id INTEGER NOT NULL,            -- 유저 ID
    skin_id INTEGER NOT NULL,            -- 스킨 ID (Skins.id 참조)
    instance_id INTEGER PRIMARY KEY,     -- 각 스킨의 고유 인스턴스 ID (중복된 스킨을 구분하기 위해)
    is_equipped BOOLEAN DEFAULT FALSE,   -- 장착 여부
    level INTEGER DEFAULT 1,             -- 스킨 레벨 (강화 시스템을 위해)
    FOREIGN KEY(skin_id) REFERENCES Skins(id)
);

-- Layer 2: Armory (각 스킨 인스턴스에 붙은 랜덤 옵션)
CREATE TABLE User_Skin_Options (
    skin_instance_id INTEGER NOT NULL,   -- User_Skins.instance_id 참조
    option_type TEXT NOT NULL,           -- 옵션 타입 (예: "FINAL_DAMAGE_PERCENT")
    option_value REAL NOT NULL,          -- 옵션 값
    FOREIGN KEY(skin_instance_id) REFERENCES User_Skins(instance_id)
);

-- Layer 3: Library (카드 마스터 테이블)
CREATE TABLE Cards (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL, -- MONSTER, BACKGROUND, LORE 등
    passive_effect_type TEXT NOT NULL,
    passive_effect_value REAL NOT NULL
);

-- Layer 3: Library (유저의 카드 수집 및 조각 현황)
CREATE TABLE User_Cards (
    user_id INTEGER NOT NULL,
    card_id INTEGER NOT NULL,
    fragments_collected INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (user_id, card_id),
    FOREIGN KEY (card_id) REFERENCES Cards(id)
);

-- Layer 4: Soul (특성 마스터 테이블)
CREATE TABLE Talents (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    cost INTEGER NOT NULL, -- 서사의 파편 소모량
    required_talent_id INTEGER, -- 선행 특성 ID (트리 구조)
    effect_type TEXT NOT NULL,
    effect_value REAL NOT NULL
);

-- Layer 4: Soul (유저가 해금한 특성)
CREATE TABLE User_Talents (
    user_id INTEGER NOT NULL,
    talent_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, talent_id),
    FOREIGN KEY (talent_id) REFERENCES Talents(id)
);
