type BranchGraphProps = {
  defaultBranch: string;
  branches: {
    name: string;
  }[];
};

export function BranchGraph({
  defaultBranch,
  branches,
}: BranchGraphProps) {
  return (
    <section className="repo-panel h-full p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="repo-kicker">
            Branch map
          </p>
          <h2 className="mt-1 text-lg font-bold text-white">
            ブランチ
          </h2>
        </div>

        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
          {defaultBranch}
        </span>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-white/5 bg-slate-950/60 p-3">
        <svg
          viewBox="0 0 240 390"
          role="img"
          aria-label={`${defaultBranch}ブランチのコミットグラフ`}
          className="mx-auto h-auto w-full max-w-64"
        >
          <defs>
            <linearGradient
              id="main-branch"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#67e8f9"
              />
              <stop
                offset="100%"
                stopColor="#34d399"
              />
            </linearGradient>
            <filter id="node-glow">
              <feGaussianBlur
                stdDeviation="3"
                result="blur"
              />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path
            d="M78 25 V365"
            stroke="url(#main-branch)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M78 105 C78 140 153 125 153 175 V230 C153 270 78 253 78 300"
            fill="none"
            stroke="#a78bfa"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M78 55 C78 82 30 82 30 115 V175 C30 205 78 204 78 230"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="5 7"
          />

          {[45, 105, 230, 300, 360].map(
            (y, index) => (
              <circle
                key={y}
                cx="78"
                cy={y}
                r={index === 4 ? 9 : 7}
                fill="#020617"
                stroke={
                  index === 4
                    ? "#34d399"
                    : "#67e8f9"
                }
                strokeWidth="4"
                filter={
                  index === 4
                    ? "url(#node-glow)"
                    : undefined
                }
              />
            ),
          )}
          <circle
            cx="30"
            cy="135"
            r="6"
            fill="#020617"
            stroke="#fbbf24"
            strokeWidth="3"
          />
          <circle
            cx="153"
            cy="190"
            r="6"
            fill="#020617"
            stroke="#a78bfa"
            strokeWidth="3"
          />
          <circle
            cx="153"
            cy="235"
            r="6"
            fill="#020617"
            stroke="#a78bfa"
            strokeWidth="3"
          />

          <text
            x="98"
            y="50"
            className="fill-slate-400 text-[11px]"
          >
            initialize
          </text>
          <text
            x="98"
            y="109"
            className="fill-slate-300 text-[11px]"
          >
            {defaultBranch}
          </text>
          <text
            x="164"
            y="194"
            className="fill-violet-300 text-[10px]"
          >
            feature
          </text>
          <text
            x="98"
            y="365"
            className="fill-emerald-300 text-[11px]"
          >
            latest
          </text>
        </svg>
      </div>

      <div className="mt-6 space-y-2">
        {branches.map((branch) => (
          <div
            key={branch.name}
            className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2"
          >
            <span className="text-sm text-white">
              {branch.name}
            </span>

            {branch.name === defaultBranch && (
              <span className="rounded-full bg-emerald-400/20 px-2 py-1 text-xs text-emerald-300">
                Default
              </span>
            )}
          </div>
        ))}
      </div>
      
      <p className="mt-4 text-xs leading-5 text-slate-500">
        Webhook接続後は、実際のpushイベントをもとに更新されます。
      </p>
    </section>
  );
}
