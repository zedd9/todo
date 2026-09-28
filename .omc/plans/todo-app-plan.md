# 할일 + 계획 관리 앱 — 프로젝트 계획

Status: **pending approval**
Source: `docs/PRD.md`

## 0. 가정 (Assumptions — 확인 필요)

PRD에 명시되지 않은 항목은 아래와 같이 가정하고 진행합니다. 다르면 알려주세요.

| 항목 | 가정 | 근거 |
|---|---|---|
| 플랫폼 | 웹 앱, Next.js(App Router) + TypeScript | 사용자 확인 완료 |
| 데이터 저장 | MongoDB, Next.js API Routes(Route Handlers)를 통해 접근 | 사용자 확인 완료 |
| 로그인/인증 | 없음 — 단일 사용자, 인증 없는 공개 API로 전체 데이터 접근 | PRD Who가 "개인 사용자"이고 로그인 요구사항 언급 없음. 다중 사용자 필요 시 별도 확인 필요 |
| 3년 목표 | 이번 범위에서 제외 | PRD §1(Why)에서만 언급, §4 기능 요구사항에는 1년 목표만 존재 |
| 주간 목표(3~5개) vs 할 일 | 서로 독립 — 주간 목표는 연결 없는 텍스트 메모, 할 일은 기존처럼 주간 계획에 직접 연결 | 사용자 확인 완료 |
| 주(week) 시작 요일 | 월요일 시작 | 별도 언급 없어 관례상 기본값 채택, 추후 설정 가능하도록 구조화 |

## 1. Requirements Summary

- 3단계 계층: 할 일(Task) → 주간 계획(WeeklyPlan) → 1년 목표(YearGoal) (`docs/PRD.md:47-48`)
- 할 일 CRUD + 상태(todo/doing/done) + 드래그앤드랍 상태 변경 (`docs/PRD.md:33-36`)
- 주간 계획: 주간 목표(텍스트, 최대 3~5개), 요일별 할 일 배치, 주간 메모 (`docs/PRD.md:38-41`)
- 목표 관리: 1년 목표 + 설명 (`docs/PRD.md:43-45`)
- 진행률: 주간 계획 진행률 자동 계산(완료/전체), 상태 변경 시 실시간 반영 (`docs/PRD.md:56`, 최초 PRD 버전 §4 P0)
- P1: 우선순위(H/M/L), 마감일, 목표별 진행률 표시, 주간 회고 (`docs/PRD.md:54-58`)

## 2. Acceptance Criteria

**할 일**
- [ ] 할 일을 생성/수정/삭제할 수 있다
- [ ] 할 일 상태는 todo/doing/done 중 하나이며 기본값은 todo다
- [ ] 보드 뷰에서 할 일 카드를 다른 상태 컬럼으로 드래그하면 상태가 즉시 변경되고 새로고침 후에도 유지된다
- [ ] 각 할 일은 정확히 하나의 주간 계획에 속한다 (주간 계획 미지정 생성 불가)
- [ ] 할 일에 요일(월~일 또는 미지정)을 배치할 수 있다

**주간 계획**
- [ ] 주간 계획을 생성할 수 있고, 주 시작일(월요일 기준)로 식별된다
- [ ] 주간 목표를 최대 5개까지 텍스트로 입력할 수 있으며 6개째 입력 시 저장이 차단된다
- [ ] 주간 메모를 자유 텍스트로 저장할 수 있다
- [ ] 주간 계획은 1년 목표에 연결하거나 미연결 상태로 둘 수 있다
- [ ] 주간 계획의 진행률(%) = 해당 계획에 속한 완료(done) 할 일 수 / 전체 할 일 수, 할 일이 0개면 0%
- [ ] 할 일 상태가 바뀌면 소속 주간 계획의 진행률이 화면 재방문 없이 즉시 갱신된다

**1년 목표**
- [ ] 1년 목표를 생성/수정/삭제할 수 있고 제목과 설명을 가진다
- [ ] (P1) 1년 목표 진행률 = 연결된 주간 계획들의 진행률 평균, 연결된 계획이 0개면 0%

**P1**
- [ ] 할 일에 우선순위(High/Medium/Low, 기본 없음)를 설정할 수 있다
- [ ] 할 일에 마감일을 설정할 수 있고 마감 지난 미완료 항목은 시각적으로 구분된다
- [ ] 주간/연간 대시보드에 진행률 바가 표시된다
- [ ] 주간 계획에 회고(텍스트)를 작성/수정할 수 있다
- [ ] 미완료 할 일을 다음 주 계획으로 이월하는 동작을 제공한다 (원본은 완료 처리하지 않음)
- [ ] 상태/기간/목표 기준으로 할 일을 검색·필터링할 수 있다

## 3. Implementation Steps

### Phase 0 — 스캐폴딩
1. Next.js(App Router) + TypeScript 프로젝트 초기화 (`package.json`, `next.config.ts`, `tsconfig.json`)
2. Tailwind CSS 설정, ESLint/Prettier 설정
3. Vitest(또는 Jest) + React Testing Library 설정
4. MongoDB 연결 유틸 — `lib/mongodb.ts` (연결 캐싱, `MONGODB_URI` 환경변수), Mongoose 스키마 — `models/{YearGoal,WeeklyPlan,Task}.ts`
5. 라우팅 구성 (App Router 페이지): `app/board/page.tsx`, `app/weekly/page.tsx`, `app/yearly/page.tsx`
6. API 라우트 스켈레톤 — `app/api/year-goals/route.ts`, `app/api/weekly-plans/route.ts`, `app/api/tasks/route.ts` (+ `[id]/route.ts` 개별 리소스용)

### Phase 1 — P0 핵심 기능
1. 타입 정의 — `types/{task,weeklyPlan,yearGoal}.ts` (Mongoose 스키마와 공유되는 인터페이스)
2. API 라우트 구현 — 각 리소스 GET(목록/단건)/POST/PATCH/DELETE (`app/api/{year-goals,weekly-plans,tasks}/route.ts`, `[id]/route.ts`)
3. 클라이언트 데이터 페칭 — SWR(또는 React Query)로 API 라우트 호출, 캐시/재검증 — `lib/api/{taskApi,weeklyPlanApi,yearGoalApi}.ts`
4. 1년 목표 CRUD UI — `app/yearly/components/YearGoalList.tsx`, `YearGoalForm.tsx`
5. 주간 계획 CRUD UI — `app/weekly/components/WeeklyPlanView.tsx` (주간 목표 리스트 입력, 메모, 목표 연결 셀렉터)
6. 할 일 CRUD + 요일 배치 UI — `app/weekly/components/TaskForm.tsx`, `DayAssignment.tsx`
7. 보드 뷰 + dnd-kit 드래그앤드랍 — `app/board/components/BoardView.tsx`, `Column.tsx`, `TaskCard.tsx` (드롭 시 PATCH 요청으로 상태 반영, optimistic update)
8. 진행률 계산 — 서버(API 응답에 포함) 또는 클라이언트 유틸 `lib/progress.ts`, 상태 변경 후 SWR 재검증으로 실시간 반영
9. Phase 1 완료 기준: Acceptance Criteria "할 일" + "주간 계획" 항목 전부 충족

### Phase 2 — P1 추가 기능
1. 우선순위/마감일 필드 추가 — Mongoose 스키마 확장 + `TaskForm.tsx` 수정
2. 1년 목표 진행률 집계 — `lib/progress.ts`에 `computeYearGoalProgress` 추가 (연결된 WeeklyPlan 진행률 평균, API 라우트에서 계산해 응답)
3. 대시보드 진행률 바 — `app/weekly/components/ProgressBar.tsx`, `app/yearly/components/ProgressBar.tsx`
4. 이월 기능 — `app/api/weekly-plans/[id]/carry-over/route.ts` (다음 주 WeeklyPlan 자동 생성/선택 후 미완료 Task 복제)
5. 검색/필터 — API 라우트에 쿼리 파라미터(status/period/goal) 추가, `app/board/components/FilterBar.tsx`
6. 주간 회고 필드 — Mongoose 스키마 + `WeeklyPlanView.tsx`에 회고 textarea 추가

## 4. Risks and Mitigations

| 위험 | 완화 방안 |
|---|---|
| 인증 없이 API가 공개되면 배포 시 누구나 데이터에 접근/수정 가능 | MVP는 개인 로컬 실행 전제로 명시, 공개 배포 전 최소한의 접근 제어(환경변수 기반 API 키 등) 필요성을 후속 과제로 기록 |
| MongoDB 연결 실패/지연이 모든 API 라우트에 영향 | `lib/mongodb.ts`에서 연결 캐싱 + 재시도, 헬스체크 라우트(`/api/health`) 추가 |
| 주 시작 요일 가정이 사용자 기대와 다를 수 있음 | 주 계산 로직을 `lib/week.ts`에 격리해 설정값 하나로 교체 가능하게 구현 |
| 드래그앤드랍이 키보드/스크린리더 사용자에게 접근 불가 | dnd-kit의 키보드 센서(keyboard sensor) 사용, 상태 변경 버튼 대체 UI 병행 제공 |
| 드래그 시 매번 API 호출로 상태 변경이 느리게 느껴질 수 있음 | optimistic update(SWR mutate) 적용 후 실패 시 롤백 |
| 3단계 계층 전체 재귀 집계(연간 진행률)가 계획 많아질수록 느려질 수 있음 | MongoDB aggregation pipeline으로 서버에서 집계, 필요 시 진행률 캐시 필드 도입 |
| "3년 목표"에 대한 기대가 있을 수 있음(Why 섹션 언급) | 이번 범위에서 명시적으로 제외함을 계획 상단에 고지, 추후 별도 PRD 갱신 필요 |

## 5. Verification Steps

- `npm run build` — 타입 에러 없이 Next.js 빌드 성공
- `npm run test` — 아래 단위/컴포넌트 테스트 통과
  - `lib/progress.ts`: 완료/전체 비율 계산, 0건일 때 0%, 연간 집계 평균 계산
  - `lib/week.ts`: 월요일 기준 주 시작일 계산, 경계값(일요일→다음 주) 처리
  - API 라우트 통합 테스트(mongodb-memory-server 사용): Task 생성 → 상태 변경 → 소속 WeeklyPlan 진행률이 응답에 반영되는지
  - `BoardView`: 드래그 종료 시 PATCH 요청이 올바른 payload로 호출되는지 (dnd-kit 테스트 유틸 + fetch mock)
  - `WeeklyPlanView`: 주간 목표 6개 입력 시 저장 차단
- 수동 QA: Acceptance Criteria 체크리스트를 Phase 1/Phase 2 완료 시점에 각각 순회하며 확인, 로컬에서 MongoDB(도커 또는 Atlas 무료 티어) 연결해 실제 CRUD 왕복 확인

---

## Changelog

- 2026-09-22: 초안 작성 (Direct mode, PRD `docs/PRD.md` 기반). 가정 사항(§0) 사용자 확인 대기 중.
- 2026-09-22: 기술 스택을 Next.js + TypeScript + MongoDB + Next.js API Routes로 변경 (사용자 지정). Phase 0/1/2 구현 단계, 위험, 검증 단계를 스택 변경에 맞게 갱신.
