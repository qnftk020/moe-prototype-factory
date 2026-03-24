# 🤖 AUTO APP GENERATION — 통합 프로젝트 지침서

> **Gemini CLI × Claude Code CLI 멀티 에이전트 앱 개발 + 오케스트레이션 대시보드**
> 이 파일 하나를 프로젝트 루트에 `CLAUDE.md`로 저장하면 바로 사용 가능합니다.
> 버전: 3.0 | 최종 수정: 2026-03-23

---

## 목차

1. [개요 & 아키텍처](#-1-개요--아키텍처)
2. [환경 준비](#-2-환경-준비)
3. [파이프라인 워크플로우 (5단계)](#-3-파이프라인-워크플로우)
4. [UI 대시보드 구현 지침](#-4-ui-대시보드-구현-지침)
5. [수도코드 ↔ UI 매핑](#-5-수도코드--ui-매핑)
6. [Claude Code에 이 문서 먹이는 법](#-6-claude-code에-이-문서-먹이는-법)
7. [트러블슈팅](#-7-트러블슈팅)

---

## 📌 1. 개요 & 아키텍처

이 프로젝트는 두 가지를 만듭니다:

**A. 멀티 에이전트 파이프라인** — Gemini(기획) + Claude(구현)로 앱을 자동 생성하는 워크플로우
**B. 오케스트레이션 대시보드** — 위 파이프라인을 시각적으로 제어하는 웹 UI ("Auto App Generation")

```
┌─────────────────────────────────────────────────────┐
│  [사용자 입력] "이런 앱을 만들고 싶어"                    │
│       │                                              │
│       ▼                                              │
│  ┌──────────┐    산출물 전달    ┌──────────────┐      │
│  │ Gemini   │ ──────────────▶ │ Claude Code  │      │
│  │ (기획/검토)│ ◀────────────── │ (구현/디버깅)  │      │
│  └──────────┘    피드백 전달    └──────────────┘      │
│       ▲                              │               │
│       └──────── 사용자 (오케스트레이터) ◀─┘               │
└─────────────────────────────────────────────────────┘
```

### 역할 정의

| 역할 | 도구 | 강점 활용 |
|------|------|----------|
| **Planner** | Gemini CLI | 1M+ 토큰 컨텍스트, 아키텍처 설계, 연쇄 질문 기반 요구사항 도출 |
| **Builder** | Claude Code CLI | 터미널 직접 접근, 파일 생성/수정, 패키지 설치, 테스트 실행 |
| **Orchestrator** | 사용자 (당신) | 산출물 검토, 단계 전환 판단, 품질 게이트 통과 여부 결정 |

### 핵심 수도코드 (전체 파이프라인 로직)

```python
import subprocess

def run_gemini_interview(initial_prompt):
    """1단계: Gemini CLI로 사용자 인터뷰 → 기획서 도출"""
    print("🚀 Gemini가 기획 인터뷰를 시작합니다...")
    plan = subprocess.check_output(
        f'gemini -p "{initial_prompt}에 대해 필요한 모든 요구사항을 '
        f'인터뷰하고 최종 기획서를 출력해줘"', shell=True
    )
    return plan

def generate_claude_config(plan):
    """2단계: 기획서 → CLAUDE.md 자동 생성"""
    print("📝 CLAUDE.md 및 프로젝트 구조 생성 중...")
    prompt = f"{plan} 이 내용을 바탕으로 Claude Code가 참조할 CLAUDE.md 파일을 작성해줘."
    subprocess.run(f'gemini -p "{prompt}" > CLAUDE.md', shell=True)

def execute_claude_code():
    """3단계: CLAUDE.md 기반 자동 코딩"""
    print("🤖 Claude Code가 구현을 시작합니다...")
    subprocess.run('claude "CLAUDE.md의 지침에 따라 전체 앱 구조를 코딩해줘"', shell=True)

def review_with_gemini():
    """4단계: Gemini CLI로 코드 리뷰"""
    print("🔍 Gemini가 코드 리뷰를 시작합니다...")
    subprocess.run('gemini -p "@src/ 전체 코드를 리뷰하고 개선 리포트를 작성해줘"', shell=True)

def apply_feedback(review_report):
    """5단계: 리뷰 결과 반영하여 코드 수정"""
    print("🔄 Claude Code가 피드백을 반영합니다...")
    subprocess.run(f'claude "{review_report} 이 피드백을 반영해서 코드를 수정해줘"', shell=True)

def main():
    user_input = input("어떤 앱을 만들고 싶으신가요?: ")

    # 순환 로직 시작
    plan = run_gemini_interview(user_input)      # → UI: Client Agent 패널
    generate_claude_config(plan)                  # → UI: Shared Artifacts에 CLAUDE.md 추가
    execute_claude_code()                         # → UI: Coding Agent 패널
    review_with_gemini()                          # → UI: Client Agent 패널 (리뷰 모드)
    # apply_feedback() 루프는 사용자 판단으로 반복

    print("✅ 초안 작성이 완료되었습니다.")
```

---

## 🔧 2. 환경 준비

### 필수 도구 설치 확인

```bash
gemini --version        # Gemini CLI
claude --version        # Claude Code CLI
git --version           # 버전 관리
node --version          # (UI 대시보드용)
```

### 프로젝트 폴더 초기화

```bash
mkdir auto-app-gen && cd auto-app-gen

# 산출물 저장용 구조
mkdir -p docs/{01-planning,02-blueprint,03-implementation-logs,04-reviews}
mkdir -p dashboard/{frontend,backend}

# Git 초기화
git init
echo "node_modules/\n.env\n__pycache__/\n.next/" > .gitignore
git add . && git commit -m "chore: init project structure"
```

### 최종 폴더 구조

```
auto-app-gen/
├── CLAUDE.md                          # ← 이 파일 (통합 지침서)
├── docs/
│   ├── 01-planning/                   # Gemini 인터뷰 결과
│   ├── 02-blueprint/                  # CLAUDE.md 백업, 아키텍처
│   ├── 03-implementation-logs/        # Claude Code 작업 로그
│   └── 04-reviews/                    # Gemini 코드 리뷰 리포트
├── dashboard/                         # 오케스트레이션 UI
│   ├── frontend/                      # React + Next.js
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── page.tsx           # 메인 대시보드
│   │   │   │   └── layout.tsx         # 루트 레이아웃
│   │   │   ├── components/
│   │   │   │   ├── PipelineStatus.tsx  # 파이프라인 진행 바
│   │   │   │   ├── AgentPanel.tsx      # CLI 로그 표시 패널
│   │   │   │   ├── FileTree.tsx        # 생성 파일 트리
│   │   │   │   ├── SharedArtifacts.tsx # 공유 산출물 목록
│   │   │   │   └── InputArea.tsx       # 사용자 입력 영역
│   │   │   └── lib/
│   │   │       ├── socket.ts          # Socket.io 클라이언트
│   │   │       └── types.ts           # 타입 정의
│   │   ├── package.json
│   │   └── tailwind.config.ts
│   └── backend/                       # Python FastAPI
│       ├── main.py                    # FastAPI 서버 + Socket.io
│       ├── agents/
│       │   ├── gemini_agent.py        # Gemini CLI subprocess 제어
│       │   └── claude_agent.py        # Claude Code subprocess 제어
│       ├── models.py                  # Pydantic 모델
│       └── requirements.txt
└── generated-app/                     # (Claude가 생성할 실제 앱 코드)
    ├── src/
    └── package.json
```

### 세션 관리 원칙

- 각 CLI는 독립적으로 실행. 하나의 터미널에서 동시에 돌리지 말 것.
- 단계 전환 시 이전 CLI 세션 종료 후 새로 시작.
- 중간 산출물은 반드시 파일로 저장 → 세션 끊겨도 복구 가능.

---

## 🔄 3. 파이프라인 워크플로우

### 전체 흐름 요약

```
[아이디어] ──▶ 1. Gemini 기획 인터뷰
                    │
                    ▼  ✅ 품질 게이트 #1
              2. Gemini → CLAUDE.md 생성
                    │
                    ▼  ✅ 품질 게이트 #2
              3. Claude Code 구현
                    │
                    ▼  ✅ 품질 게이트 #3
              4. Gemini 코드 리뷰
                    │
                    ▼  ✅ 품질 게이트 #4
               ┌────┴────┐
               │ 통과?    │
               ▼         ▼
           [완료! 🎉]  5. Claude 수정 → 4단계로 복귀
```

---

### 🎨 1단계: 기획 인터뷰 (Envisioning)

> **담당:** Gemini CLI | **목표:** 막연한 아이디어 → 요구사항 명세서

#### Gemini 프롬프트 (복사해서 그대로 사용)

```
당신은 시니어 프로덕트 매니저 겸 테크 리드입니다.
나는 앱을 하나 만들고 싶은데, 아직 구체적인 사양이 없습니다.

아래 순서로 나에게 질문을 던져서 요구사항을 확정해 주세요:
1. 핵심 목적 & 타겟 사용자 (누가, 왜 쓰는가?)
2. 핵심 기능 목록 (MVP 범위 — 최대 5개)
3. 기술 스택 제안 (프론트/백/DB/배포)
4. 데이터 모델 초안 (주요 엔티티와 관계)
5. 화면 흐름 (메인 유저 플로우 2~3개)
6. 비기능 요구사항 (인증, 반응형, 오프라인 등)

한 번에 하나씩 질문하고, 내 답변을 들은 후 다음 질문으로 넘어가세요.
모든 질문이 끝나면 아래 형식의 최종 기획서를 출력해 주세요:

---
## 프로젝트명: [이름]
## 핵심 목적: [한 줄 설명]
## 타겟 사용자: [설명]
## MVP 기능:
1. [기능1]: [설명]
2. [기능2]: [설명]
## 기술 스택:
- Frontend: [...]
- Backend: [...]
- Database: [...]
- Deployment: [...]
## 데이터 모델:
[엔티티명] - [필드 목록] - [관계]
## 화면 흐름:
Flow 1: [단계1] → [단계2] → [단계3]
## 비기능 요구사항:
- [항목1]
---

나의 앱 아이디어는 다음과 같아: [여기에 아이디어 입력]
```

#### 산출물 저장
```bash
nano docs/01-planning/spec.md
```

#### ✅ 품질 게이트 #1
- [ ] MVP 기능이 5개 이하로 명확히 정의되어 있는가?
- [ ] 기술 스택이 구체적 라이브러리/프레임워크 수준으로 명시되어 있는가?
- [ ] 데이터 모델에 최소 주요 필드와 관계가 정의되어 있는가?
- [ ] 화면 흐름이 사용자 관점에서 이해 가능한가?

```bash
git add docs/01-planning/ && git commit -m "docs: planning spec complete"
```

---

### 🏗️ 2단계: CLAUDE.md 생성 (Blueprinting)

> **담당:** Gemini CLI | **목표:** 기획서 → Claude Code 작업 지침서

#### Gemini 프롬프트

```
아래는 확정된 앱 기획서입니다:

[docs/01-planning/spec.md 내용 전체를 여기에 붙여넣기]

이 기획서를 바탕으로 'CLAUDE.md' 파일을 작성해 주세요.
Claude Code CLI가 이 파일을 읽고 자율적으로 코딩할 수 있어야 합니다.

CLAUDE.md에 반드시 포함할 내용:

### 1. 프로젝트 개요 — 앱 이름, 목적, 타겟 사용자 (1~2문장)
### 2. 기술 스택 (버전 포함) — 각 기술의 선택 이유 한 줄씩
### 3. 프로젝트 구조 (File Tree) — 각 디렉토리의 역할 설명
### 4. 데이터 모델 상세 — 각 엔티티의 필드, 타입, 관계를 코드 수준으로
### 5. 구현 우선순위 (Task Checklist)
- [ ] Task 1: [설명] — 예상 파일: [파일명]
- [ ] Task 2: ...
### 6. 코딩 컨벤션 — 네이밍 규칙, 폴더 구조 원칙, 에러 처리 패턴
### 7. 테스트 요구사항 — 단위 테스트 필수 대상, 테스트 프레임워크
### 8. 금지 사항 — 하지 말아야 할 것들 (예: 외부 API 키 하드코딩 금지)
```

#### 산출물 저장
```bash
nano CLAUDE.md
cp CLAUDE.md docs/02-blueprint/CLAUDE.md
```

#### ✅ 품질 게이트 #2
- [ ] File Tree가 실제 생성 가능한 구조인가?
- [ ] Task Checklist가 구현 순서대로 정렬, 파일명 명시되어 있는가?
- [ ] 데이터 모델이 필드 타입까지 구체적인가?

```bash
git add CLAUDE.md docs/02-blueprint/ && git commit -m "docs: CLAUDE.md blueprint ready"
```

---

### 💻 3단계: 구현 (Implementation)

> **담당:** Claude Code CLI | **목표:** CLAUDE.md 기반 실제 코드 작성

#### 세션 시작 & 초기 프롬프트

```bash
cd auto-app-gen
claude
```

```
프로젝트 루트의 CLAUDE.md를 읽어줘.
이 문서에 정의된 아키텍처와 Task Checklist에 따라 작업을 시작해.

순서:
1. CLAUDE.md의 File Tree대로 디렉토리와 빈 파일 생성
2. 필요한 패키지/라이브러리 설치
3. Task Checklist의 순서대로 하나씩 구현
4. 각 Task 완료 후 간단한 동작 테스트

작업 중 CLAUDE.md와 충돌하는 부분이 있으면 바로 알려줘.
임의로 설계를 변경하지 마.
```

#### 작업 팁: Task 단위로 나눠서 지시

```
# 좋은 예
"Task 1번: 사용자 인증 기능을 구현해줘. CLAUDE.md의 데이터 모델 참고해서."

# 나쁜 예
"CLAUDE.md에 있는 거 전부 다 만들어."
```

#### ✅ 품질 게이트 #3
- [ ] CLAUDE.md의 모든 Task가 완료되었는가?
- [ ] `npm run dev`가 에러 없이 동작하는가?
- [ ] 기본적인 유저 플로우를 직접 테스트해 보았는가?
- [ ] 하드코딩된 시크릿/API키가 없는가?

```bash
git add -A && git commit -m "feat: MVP implementation complete"
```

---

### 🔍 4단계: 코드 리뷰 (Review)

> **담당:** Gemini CLI | **목표:** 전체 코드베이스 객관적 검토

#### Gemini 프롬프트

```
아래는 앱의 설계 지침서(CLAUDE.md)와 실제 구현된 코드입니다.

[CLAUDE.md 내용 붙여넣기]
[주요 소스 파일 내용 붙여넣기 — 또는 @src/ 활용]

다음 관점에서 코드 리뷰를 수행해 주세요:
1. 설계 준수: CLAUDE.md 아키텍처/컨벤션 위반 부분
2. 로직 오류: 버그 가능성이 있는 코드
3. 보안 취약점: XSS, SQL Injection, 인증 우회 등
4. 성능 이슈: 불필요한 리렌더링, N+1 쿼리 등
5. 코드 품질: 중복 코드, 네이밍 부적절, 미사용 import 등

리뷰 결과를 아래 형식으로 출력해 주세요:

---
## 코드 리뷰 리포트
### 🔴 Critical (즉시 수정 필요)
- [파일명:라인] 문제 설명 → 수정 제안
### 🟡 Warning (권장 수정)
- [파일명:라인] 문제 설명 → 수정 제안
### 🟢 Suggestion (개선 아이디어)
- [파일명:라인] 제안 내용
### 📊 종합 점수: [1~10] / 10
---
```

#### ✅ 품질 게이트 #4
- [ ] Critical 이슈가 0개인가?
- [ ] 종합 점수가 7점 이상인가?

> Critical 있음 → 5단계로 | 모두 통과 → 🎉 완료!

---

### 🔄 5단계: 수정 루프 (Feedback Loop)

> **담당:** Claude Code CLI | **목표:** 리뷰 결과 반영

#### Claude 프롬프트

```
Gemini의 코드 리뷰 결과를 반영해서 코드를 수정해줘.

## 리뷰 결과:
[docs/04-reviews/review-round-1.md 내용 붙여넣기]

수정 규칙:
1. 🔴 Critical 항목은 모두 수정
2. 🟡 Warning 항목 중 아래 번호만 수정: [수정할 번호 나열]
3. 🟢 Suggestion은 무시
4. 수정한 파일과 변경 내용을 요약해줘
```

#### 루프 종료 조건

| 조건 | 판단 |
|------|------|
| Critical 0개 + 종합 7점 이상 | ✅ 루프 종료 |
| Critical 존재 | 🔄 수정 후 재리뷰 |
| 3회 이상 반복해도 해결 안 됨 | ⚠️ 수동으로 직접 수정 |

---

## 🖥️ 4. UI 대시보드 구현 지침

> 이 섹션은 **오케스트레이션 대시보드 ("Auto App Generation")** 웹 UI를 구현하기 위한 지침입니다.
> Claude Code에게 이 섹션을 읽히면 대시보드를 직접 만들 수 있습니다.

### 디자인 방향

- **Notion 스타일**: 흰색 배경, 최소 보더, 넉넉한 여백, 플랫 표면
- **대제목**: "Auto App Generation"
- **모노스페이스 로그**: CLI 출력은 `SF Mono` / `Fira Code` 계열

### 전체 레이아웃

```
┌─────────────────────────────────────────────────────────┐
│ [Topbar] Auto App Generation / {프로젝트명}    [Settings]│
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🤖 Auto App Generation                  (32px, 700wt) │
│  Gemini CLI + Claude Code CLI 파이프라인  (14px, 회색)   │
│                                                         │
│  ● Envisioning → ● Blueprinting → ◉ Implementation → ..│
│                                                         │
│  [ 어떤 앱을 만들고 싶으신가요?________ ] [ Generate ]    │
│                                                         │
│  ┌────────────────────┐ ┌────────────────────┐          │
│  │ ✨ Client Agent    │ │ ⚡ Coding Agent    │          │
│  │   (Gemini CLI)     │ │   (Claude Code)    │          │
│  │                    │ │                    │          │
│  │  GEM: 질문 중...   │ │  CLD: 파일 생성 중..│          │
│  │  USR: 답변...      │ │  SYS: npm install..│          │
│  │                    │ │                    │          │
│  │ [입력창] [Send]    │ │ [입력창] [Send]    │          │
│  └────────────────────┘ └────────────────────┘          │
│                                                         │
│  ┌──────────┐ ┌──────────────────────────────┐          │
│  │ File Tree│ │     Shared Artifacts         │          │
│  └──────────┘ └──────────────────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

### 색상 팔레트 (CSS 변수)

```css
:root {
  --bg: #ffffff;
  --bg-secondary: #f7f7f5;
  --bg-hover: #f1f1ef;
  --text-primary: #37352f;
  --text-secondary: #787774;
  --text-tertiary: #b4b4b0;
  --border: #e9e9e7;
  --accent-blue: #2383e2;       /* 활성 상태, Pipeline active */
  --accent-blue-bg: #e8f0fe;
  --accent-green: #0f7b6c;      /* 완료, done */
  --accent-green-bg: #dbeddb;
  --accent-orange: #d9730d;     /* Claude 강조 */
  --accent-orange-bg: #fbecdd;
  --accent-purple: #6940a5;     /* Gemini 강조 */
  --accent-purple-bg: #eae4f2;
  --accent-red: #e03e3e;        /* 에러 */
  --accent-red-bg: #fbe4e4;
}
```

### 컴포넌트 상세

#### 4-1. PipelineStatus (파이프라인 진행 바)

```
컴포넌트: PipelineStatus.tsx
위치: 입력 영역 위
```

- 5단계를 가로로 나열: Envisioning → Blueprinting → Implementation → Review → Feedback Loop
- 각 단계의 상태: `done` (초록), `active` (파랑 + 펄스 애니메이션), `waiting` (회색)
- 단계 사이에 `→` 화살표
- 배경: `var(--bg-secondary)`, 둥근 모서리 `8px`

#### 4-2. AgentPanel (핵심 — 좌우 2분할)

```
컴포넌트: AgentPanel.tsx
Props: agent ('gemini' | 'claude'), logs[], status ('running' | 'idle')
```

**구조:**
- Header: 에이전트 뱃지(✨ Gemini / ⚡ Claude) + 이름(Client Agent / Coding Agent) + 상태 표시등
- Body: CLI 로그 스크롤 영역 (모노스페이스, 배경 `var(--bg-secondary)`)
- Footer: 사용자 추가 입력 필드 + Send 버튼

**로그 라인 형식:**
```
[10:01] GEM  안녕하세요! 운동 기록 PWA를 만들어 볼게요.
[10:02] USR  헬스, 러닝, 홈트레이닝 세 가지를 기본으로 해줘
[10:03] SYS  docs/01-planning/spec.md 저장됨 (2.4KB)
[10:04] CLD  Task 1/5: 프로젝트 초기화
[10:05] ERR  모듈 not found: @supabase/supabase-js
```

**Prefix 색상:**

| Prefix | 색상 변수 | 의미 |
|--------|----------|------|
| `GEM` | `--accent-blue` | Gemini 출력 |
| `CLD` | `--accent-orange` | Claude 출력 |
| `SYS` | `--accent-green` | 시스템 이벤트 |
| `USR` | `--accent-purple` | 사용자 입력 |
| `ERR` | `--accent-red` | 에러 |

#### 4-3. FileTree (생성 파일 트리)

```
컴포넌트: FileTree.tsx
위치: 하단 좌측 (width: 300px)
```

- Claude Code가 생성한 파일 구조를 실시간 표시
- 새로 생성된 파일에 초록색 `new` 뱃지
- 폴더 접기/펼치기 지원
- 폰트: 모노스페이스, 12.5px

#### 4-4. SharedArtifacts (공유 산출물)

```
컴포넌트: SharedArtifacts.tsx
위치: 하단 우측 (flex: 1)
```

- 두 AI 간 공유되는 산출물 목록 (spec.md, CLAUDE.md, 주요 소스 파일)
- 각 아이템에 생성자 태그: `Gemini` (보라) / `Claude` (주황)
- 파일 크기, 생성 시간 표시
- 아이콘: `.md` = 파랑, 코드 = 주황, 리뷰 = 초록

### UI 구현용 Claude 프롬프트

대시보드를 Claude Code에게 만들게 하려면 아래 프롬프트를 사용하세요:

```
CLAUDE.md의 "4. UI 대시보드 구현 지침" 섹션을 읽어줘.

dashboard/frontend/ 폴더에 Next.js + Tailwind CSS 프로젝트를 만들어.
디자인은 Notion 스타일 (흰색 배경, 플랫, 최소 보더).

구현 순서:
1. Next.js + Tailwind 초기 설정
2. PipelineStatus 컴포넌트 — 5단계 진행 바
3. AgentPanel 컴포넌트 — CLI 로그 표시 (좌: Gemini, 우: Claude)
4. InputArea 컴포넌트 — 사용자 입력 + Generate 버튼
5. FileTree 컴포넌트 — 파일 트리 표시
6. SharedArtifacts 컴포넌트 — 산출물 목록
7. page.tsx에서 모든 컴포넌트 조합

색상 팔레트는 CLAUDE.md의 CSS 변수를 그대로 사용해.
로그 데이터는 일단 하드코딩된 mock 데이터로 구현해.
```

### 백엔드 구현용 Claude 프롬프트

```
dashboard/backend/ 폴더에 FastAPI + Socket.io 서버를 만들어.

기능:
1. POST /api/start — 사용자 입력을 받아 파이프라인 시작
2. Gemini CLI를 subprocess로 실행하고 출력을 Socket.io로 스트리밍
3. Claude Code CLI를 subprocess로 실행하고 출력을 Socket.io로 스트리밍
4. 파이프라인 상태 관리 (어떤 단계인지 추적)
5. 생성된 파일 목록을 File Tree용으로 제공

라이브러리: fastapi, python-socketio, uvicorn, pexpect
```

### 기술 스택

| 레이어 | 기술 | 이유 |
|--------|------|------|
| Frontend | Next.js 14+ | App Router, 서버 컴포넌트 |
| 스타일 | Tailwind CSS | Notion 스타일 빠르게 구현 |
| 실시간 | Socket.io | CLI 출력 실시간 스트리밍 |
| Backend | Python FastAPI | subprocess로 CLI 제어 용이 |
| 프로세스 | pexpect / pty | 터미널 세션 인터랙티브 제어 |
| 폰트 | Pretendard | 한글 지원 + 깔끔한 산세리프 |

### 반응형 규칙

| 화면 폭 | 변경 |
|---------|------|
| > 900px | Agent 패널 2열, 하단 2열 |
| ≤ 900px | 모든 패널 1열 세로 스택 |

---

## 🔗 5. 수도코드 ↔ UI 매핑

수도코드의 각 함수가 UI의 어느 영역에서 시각화되는지:

| 수도코드 함수 | Pipeline 단계 | UI 컴포넌트 | 로그 Prefix |
|---|---|---|---|
| `run_gemini_interview()` | Envisioning | Client Agent (좌) | GEM, USR |
| `generate_claude_config()` | Blueprinting | Client Agent (좌) + SharedArtifacts | GEM, SYS |
| `execute_claude_code()` | Implementation | Coding Agent (우) + FileTree | CLD, SYS |
| `review_with_gemini()` | Review | Client Agent (좌) | GEM |
| `apply_feedback()` | Feedback Loop | Coding Agent (우) | CLD, SYS |

### 상태 전이

```
Pipeline 상태 = {
  current_step: 'envisioning' | 'blueprinting' | 'implementation' | 'review' | 'feedback',
  steps: {
    envisioning:    'waiting' | 'active' | 'done',
    blueprinting:   'waiting' | 'active' | 'done',
    implementation: 'waiting' | 'active' | 'done',
    review:         'waiting' | 'active' | 'done',
    feedback:       'waiting' | 'active' | 'done',
  }
}
```

---

## 📘 6. Claude Code에 이 문서 먹이는 법

### 방법 1: 루트 배치 (가장 추천)

```bash
# 이 파일을 프로젝트 루트에 CLAUDE.md로 저장
cp AUTO_APP_GENERATION.md CLAUDE.md

# 그냥 실행 — 자동 인식
cd auto-app-gen
claude
```

Claude Code는 프로젝트 루트의 `CLAUDE.md`를 **자동으로 읽습니다.**
별도로 전달할 필요 없이 파일만 올바른 위치에 두면 됩니다.

### 방법 2: 파이프로 직접 전달

```bash
cat CLAUDE.md | claude -p "이 지침서를 읽고 Task 1부터 시작해"
```

### 방법 3: 세션 내 읽기 지시

```bash
claude
```
```
> 프로젝트 루트의 CLAUDE.md를 읽어줘.
> "4. UI 대시보드 구현 지침" 섹션을 참고해서 dashboard/frontend/를 만들어줘.
```

### 방법 4: 특정 섹션만 참조

이 문서가 길기 때문에 특정 작업에 맞는 섹션만 가리킬 수 있습니다:

```
# 파이프라인만 실행할 때
"CLAUDE.md의 3번 섹션(파이프라인 워크플로우)만 읽고, 1단계부터 시작해."

# UI 대시보드를 만들 때
"CLAUDE.md의 4번 섹션(UI 대시보드 구현 지침)을 읽고, dashboard/frontend/를 구현해줘."

# 백엔드만 만들 때
"CLAUDE.md 4번 섹션의 백엔드 구현용 프롬프트를 따라 dashboard/backend/를 만들어줘."
```

### 작성 팁 (이 문서를 수정할 때 참고)

- **헤딩(`## ###`)을 명확히** — Claude Code가 구조적으로 인식함
- **Task는 체크박스로** (`- [ ]`) — 완료 시 `- [x]`로 업데이트 가능
- **파일명을 명시** — "API를 만들어"보다 "src/app/api/route.ts에 GET 핸들러를 만들어"가 정확
- **금지 사항을 포함** — Claude Code는 "하지 마라"를 잘 따름
- **코드 블록 예시 포함** — 테이블/코드 형태의 예시가 있으면 훨씬 정확하게 구현

---

## 🛟 7. 트러블슈팅

### Claude가 CLAUDE.md를 무시하고 자기 마음대로 할 때

```
잠깐 멈춰. CLAUDE.md를 다시 읽고, Task Checklist의 [N]번 항목만 진행해.
네가 방금 생성한 [파일명]은 CLAUDE.md의 File Tree와 다르니까 삭제하고 다시 해줘.
```

### Gemini의 리뷰가 너무 추상적일 때

```
리뷰를 더 구체적으로 해줘.
"코드 품질 개선 필요"가 아니라, 정확한 파일명과 라인 번호,
그리고 수정 전/후 코드 예시를 포함해서 다시 작성해줘.
```

### 두 AI의 의견이 충돌할 때

```
# Gemini에게:
Claude Code가 [이러이러한 방식]으로 구현했는데,
너의 설계와 다른 점이 있어. 어느 쪽이 더 나은지
장단점을 비교해서 추천해줘.
# → 사용자가 최종 결정 후 Claude에게 수정 지시
```

### 중간에 세션이 끊겼을 때

```bash
git log --oneline -5                              # 마지막 커밋 확인
cat docs/03-implementation-logs/progress.md        # 진행 로그 확인
claude                                             # 재개
# → "CLAUDE.md를 읽고, Task [N]번부터 이어서 진행해줘."
```

### 이 문서가 너무 길어서 Claude가 잘 못 읽을 때

```
CLAUDE.md가 길어서 핵심만 요약해줄게:
지금 해야 할 일: [구체적 Task 설명]
참고할 섹션: CLAUDE.md의 [N]번 섹션
생성할 파일: [파일 경로]
사용할 기술: [스택]
```

### Git 브랜치 전략 (고급)

```bash
git checkout -b feat/task-1-auth
# ... Claude가 구현 ...
git add -A && git commit -m "feat: task 1 auth"
git checkout main && git merge feat/task-1-auth
```

---

> **기억하세요:** 이 워크플로우에서 가장 중요한 사람은 **당신(오케스트레이터)**입니다.
> AI는 도구이고, 최종 판단과 품질 결정은 항상 사용자의 몫입니다.
