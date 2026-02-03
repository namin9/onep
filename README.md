## 🤖 AI Interaction Context
- **AI Role:** Chief Archive Architect (Senior Game Designer & Backend Expert)
- **Dev Style:** Vibe Coding (Proactive, High-efficiency, Cloudflare-focused)
- **Hard constraints:** - Units must use Tier-based system (K, M, B... AA).
  - Rewards must follow the '1 Ruby per Kill' & 'Pension' system.
  - UI/UX must prioritize 'fast-track' (3-4 days to 1,000 stages).

📖 Project: Archive Editor - Lore Expansion Guide
이 문서는 **[아카이브 에디터: 심연의 기록자]**의 세계관 확장을 위해 AI와 협업하는 가이드라인을 정의합니다. 3만 화의 텍스트 데이터를 게임의 '서사적 자산'으로 변환하는 과정을 담습니다.

🌌 1. 세계관 핵심 설정 (Core Lore)
1.1. 거대 보관소 '아카이브(The Archive)'
모든 소설의 완결된 세계가 데이터의 형태로 저장되는 우주의 끝.

본래는 질서 정연했으나, 원인 불명의 '서사 오류(Corruption)'로 인해 장르 간 경계가 무너짐.

1.2. 서사 오염 (The Corruption)
오타(Typo): 일반 몬스터. 문장의 의미를 훼손하는 하급 개체.

비문(Anacoluthon): 정예 몬스터. 논리가 깨진 문장으로 이루어진 괴물.

설정 충돌(Setting Conflict): 보스. 장르가 뒤섞여 탄생한 기괴한 존재 (예: 마법을 쓰는 무림 고수).

1.3. 플레이어: 심연의 에디터 (The Editor)
오염된 문장을 도려내고, 흩어진 파편(스킨 조각)을 모아 소설의 '진정한 결말'을 복구하는 존재.

🤖 2. AI 협업 프로세스 (AI Collaboration Workflow)
STEP 1: 데이터 추출 (Data Extraction)
사용자님의 NVIDIA 4070 Super를 활용해 로컬 LLM 혹은 Python 스크립트로 3만 화 데이터에서 핵심 키워드, 주인공 이름, 시그니처 대사를 추출합니다.

STEP 2: 시나리오 확장 프롬프트 (Prompting)
AI와 대화할 때 아래와 같은 페르소나를 부여하여 세계관을 확장합니다.

"너는 20년 경력의 베테랑 웹소설 편집자이자 게임 시나리오 작가야. 내가 제공하는 [무협] 장르 소설의 시놉시스를 바탕으로, 500층 보스로 등장할 '오염된 문주'의 외형 묘사와 그가 떨어뜨릴 '전설급 스킨 조각'의 서사적 설명을 작성해줘."

STEP 3: 콘텐츠 치환 (Content Mapping)
캐릭터 이름: 스킨 명칭 및 도감 항목으로 사용.

소설 에피소드: 스테이지 100단위별 배경 테마 및 퀘스트 문구로 사용.

명대사: 크리티컬(트리플/하이퍼) 발생 시 화면에 스쳐 지나가는 이펙트 텍스트로 사용.

🛠 3. AI와 대화할 때 지킬 원칙 (Guidelines)
지수적 성장의 미학: "이 소설의 주인공이 각성할 때의 카타르시스를 게임의 '데미지 단위 점프(K -> M -> B)'와 어떻게 연결할까?"를 지속적으로 질문할 것.

장르 융합: "무협과 SF가 섞였을 때 나올 수 있는 가장 기괴한 옵션 명칭은?"과 같은 창의적 질문 던지기.

숙제 해방의 서사: 유저가 1,000층에 도달해 '연금'을 받는 행위를 "서사의 영구적 복원"이라는 관점에서 명예롭게 묘사할 것.

📈 4. 향후 확장 계획
[ ] 장르별(무협/판타지/로판) 5단계 스킨 등급 명칭 확정.

[ ] 스테이지 클리어 특성(Passive)의 이름을 소설 속 '기연'이나 '스킬' 명칭으로 치환.

[ ] AI를 활용해 3만 화 소설 데이터를 '카드 도감'으로 자동 분류하는 알고리즘 구축.

💡 AI에게 던질 첫 번째 질문 (Vibe Check)
이제 이 README를 AI(Gemini/CLI)에게 보여주고 다음과 같이 시작해 보세요.

"위 세계관 가이드를 읽어봐. 이제 3만 화의 소설 중 하나인 [현대 판타지: 재벌집 막내 편집자]라는 소설을 바탕으로, 유저가 300층에서 얻게 될 'SSS급 옵션'의 이름과 그에 걸맞은 화려한 텍스트 연출을 제안해줘."