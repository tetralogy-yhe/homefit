# HomeFit — 앱 설계 계획

## Context
가사를 to-do list 형태로 관리하는 웹앱. 집/공간/가전을 등록하고, 청소 주기를 자동으로 계산해 오늘 해야 할 일을 보여준다. 실행 패턴 기반으로 주기를 추천하고 청소 팁도 제공한다.

**Tech Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Prisma + PostgreSQL · NextAuth.js · TanStack Query · Zustand

---

## 1. 폴더 구조

```
homefit/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── public/
│   └── icons/ (spaces/, items/)
└── src/
    ├── app/
    │   ├── (auth)/           # login, register
    │   ├── (app)/            # authenticated shell (sidebar + topbar)
    │   │   ├── dashboard/    # 오늘의 할 일
    │   │   ├── homes/        # 집 목록 + [homeId]/spaces/[spaceId]/items/
    │   │   ├── tasks/        # 전체 할 일 + [taskId]/
    │   │   ├── tips/         # 팁 라이브러리
    │   │   └── settings/
    │   ├── onboarding/       # 4단계 위저드 (별도 레이아웃)
    │   └── api/
    │       ├── homes/[homeId]/spaces/[spaceId]/items/
    │       ├── tasks/
    │       │   ├── today/
    │       │   └── [taskId]/complete/
    │       ├── task-templates/
    │       ├── tips/
    │       └── recommendations/
    ├── components/
    │   ├── ui/         # Button, Input, Modal, Badge, Card, etc.
    │   ├── layout/     # Sidebar, TopBar, MobileNav
    │   ├── homes/      # HomeCard, HomeForm
    │   ├── spaces/     # SpaceTree, SpaceCard, SpaceForm
    │   ├── items/      # ItemCard, ItemForm, ItemTemplateSelector
    │   ├── tasks/      # TaskCard, TaskList, TaskFilters, TaskCompletionModal
    │   ├── dashboard/  # TodayTaskGroup, ProgressRing, UpcomingTasksBanner
    │   └── tips/       # TipCard, TipDetail
    ├── lib/
    │   ├── prisma.ts
    │   ├── auth.ts
    │   ├── cycle-engine.ts     # 핵심: 주기 추천 로직
    │   ├── task-generator.ts   # 아이템 등록 시 Task 자동 생성
    │   ├── constants.ts
    │   └── validators/         # zod schemas
    ├── hooks/          # useHomes, useTasks, useTodayTasks, etc.
    ├── store/          # Zustand: UI state, onboarding wizard
    └── types/
```

---

## 2. 데이터 모델 (Prisma)

### 핵심 엔티티

```
User ──< Home ──< Space ──< Item ──< Task ──< CompletionLog

ItemTemplate (시드 데이터)
 └──< TaskTemplate  ← 기본 주기 정의
 └──< Item          ← 사용자 아이템이 참조

Tip  ← 청소 팁 라이브러리 (시드 데이터)
```

### 주요 모델

| 모델 | 핵심 필드 |
|------|-----------|
| **Home** | userId, name, type(STUDIO/APARTMENT/VILLA/HOUSE/OFFICETEL), address |
| **Space** | homeId, name, type(LIVING_ROOM/KITCHEN/BATHROOM/BEDROOM...), order |
| **Item** | spaceId, templateId?, name, category, lastCleanedAt, lastMaintainedAt |
| **ItemTemplate** | name, category, icon — 시드 카탈로그 |
| **TaskTemplate** | itemTemplateId?, spaceType?, name, defaultCycleUnit, defaultCycleEvery, guideSteps(JSON), productTips(JSON) |
| **Task** | itemId?, spaceId, homeId, userId, status(PENDING/DONE/SKIPPED/SNOOZED), cycleUnit, cycleEvery, dueDate, cycleOverridden |
| **CompletionLog** | taskId, completedAt, scheduledDueDate, **daysEarlyOrLate**, cycleUnitAtTime |
| **Tip** | title, body(markdown), category, itemTemplateId?, spaceType?, tags[] |

**설계 결정:**
- Task에 homeId/spaceId/userId 비정규화 → 대시보드 쿼리 최적화
- 완료 시 Task 업데이트가 아니라 새 Task 생성 → 이력 보존, 쿼리 단순화
- CompletionLog에 cycleUnit 스냅샷 → 나중에 주기 변경해도 과거 drift 계산 정확

---

## 3. 주요 화면

### Dashboard (오늘의 할 일)
- 상단: 진행률 바 (N/M 완료)
- 공간별 그룹핑된 오늘 할 일 목록
- 각 태스크: 완료하기 / 뒤로미루기 버튼
- 하단: 이번 주 예정 태스크 배너

### Home Setup
- 집 카드 목록 + 추가 버튼
- 집 유형 아이콘 선택 UI (원룸/아파트/빌라/단독/오피스텔)

### Space & Item Setup (Tree View)
- 집 → 공간 → 아이템 아코디언 트리
- 아이템별 마지막 청소일 + 지연 경고 배지
- 빠른 추가: ItemTemplate 칩 선택

### Task Management (전체 할 일)
- 필터: 오늘/이번주/이번달/기간지남 + 집/공간/주기
- 섹션: 기간지남(⚠️) → 오늘 → 이번 주 → 이후

### Task Detail / Completion
- 청소 단계별 가이드 (template.guideSteps)
- 추천 제품 (template.productTips)
- 완료 이력 목록 (CompletionLog)
- 주기 조정 AI 제안 배너
- 완료 모달: 날짜 선택 + 메모 + 다음 예정일 미리보기

### Tips & Guides
- 카테고리 탭 필터 + 검색
- 추천 팁 + 계절별 체크리스트

---

## 4. 온보딩 플로우

```
회원가입 → 환영 화면
  → Step 1: 집 등록 (이름, 유형, 주소)
  → Step 2: 공간 선택 (체크박스 그리드, 자동 번호 부여)
  → Step 3: 공간별 가전/가구 빠른 추가
  → [할 일 자동 생성] → 완료 화면 → Dashboard
```

---

## 5. 규칙 기반 주기 추천 로직 (`cycle-engine.ts`)

### 알고리즘

1. 최근 N회(최소 3, 최대 10) CompletionLog의 `daysEarlyOrLate` 평균 = **drift score**
2. 주기별 임계값:

| 주기 | 단축 임계값 | 연장 임계값 |
|------|------------|------------|
| DAILY | < -0.5일 | > 1.5일 |
| WEEKLY | < -2일 | > 4일 |
| MONTHLY | < -7일 | > 10일 |
| QUARTERLY | < -14일 | > 21일 |

3. **2회 연속** 임계값 초과 시에만 제안 (오탐 방지)
4. 제안은 소프트 알림 — 자동 적용 없음, 사용자가 수락/거절
5. 역방향 제안 억제: 직전 제안 적용 후 2사이클 동안 반대 방향 제안 없음

### 완료 처리 API (`POST /api/tasks/[taskId]/complete`)
```
1. task.status = DONE, completedAt 기록
2. daysEarlyOrLate 계산 → CompletionLog 생성
3. cycle-engine 실행 → 제안 생성 (있을 경우)
4. 다음 Task 생성: dueDate = completedAt + cycleEvery * cycleUnit
```

---

## 6. 핵심 파일 목록

| 파일 | 역할 |
|------|------|
| `prisma/schema.prisma` | 전체 DB 스키마 |
| `src/lib/cycle-engine.ts` | 주기 추천 핵심 로직 |
| `src/lib/task-generator.ts` | 아이템 등록 → Task 자동 생성 |
| `src/app/(app)/dashboard/page.tsx` | 메인 화면 |
| `src/app/api/tasks/[taskId]/complete/route.ts` | 완료 처리 + 다음 Task 생성 |
| `src/app/onboarding/` | 4단계 온보딩 위저드 |
| `prisma/seed.ts` | ItemTemplate, TaskTemplate, Tip 시드 데이터 |

---

## 7. 검증 방법

1. **온보딩**: 신규 가입 → 집/공간/아이템 등록 → Task 자동 생성 확인
2. **대시보드**: 오늘 기준 PENDING Task 표시 확인
3. **완료 처리**: 완료 후 CompletionLog 생성 + 새 Task 생성 + dueDate 계산 정확성
4. **주기 추천**: 3회 이상 일찍/늦게 완료 시 추천 배너 노출
5. **뒤로 미루기**: snoozedUntil 날짜에만 재노출 확인
6. **필터링**: 기간지남/오늘/이번주 필터 정확성
