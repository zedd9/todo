export default function LandingPage() {
  return (
    <div className="flex h-full min-h-[32rem] items-center justify-center bg-canvas">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-md border border-hairline p-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-surface-soft text-primary">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="h-8 w-8"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z"
            />
          </svg>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-display-xl text-ink">할일 + 계획 관리</h1>
          <p className="text-body-sm text-muted">단기 실행과 장기 목표를 한 곳에서</p>
        </div>

        <a
          href="/auth/github"
          className="w-full rounded-full bg-primary px-4 py-3 text-button-md text-on-primary hover:bg-primary-active"
        >
          GitHub로 로그인
        </a>

        <p className="text-caption-sm text-muted-soft">
          로그인 시 GitHub 사용자명과 프로필 사진을 저장합니다.
        </p>
      </div>
    </div>
  );
}
