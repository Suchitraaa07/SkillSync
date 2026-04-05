"use client";

function TabButton({ isActive, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-300",
        isActive
          ? "bg-gradient-to-r from-violet-500/80 to-fuchsia-500/80 text-white shadow-[0_0_16px_rgba(139,92,246,0.45)]"
          : "text-slate-300 hover:text-white",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function LinkCard({ item }) {
  return (
    <article className="rounded-xl border border-white/10 bg-slate-900/70 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <span className="inline-flex rounded-md bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
        {item.tag}
      </span>
      {item.url ? (
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 block text-sm font-medium text-slate-100 underline decoration-slate-500 underline-offset-4 hover:text-violet-200"
        >
          {item.title}
        </a>
      ) : (
        <p className="mt-2 text-sm font-medium text-slate-200">{item.title}</p>
      )}
    </article>
  );
}

export function RightPanel({
  selectedNode,
  activeTab,
  setActiveTab,
  nodeStatus,
  setNodeStatus,
  summaryText,
  resourceLinks,
  relatedNodes,
  onSelectNode,
}) {
  return (
    <aside className="h-[740px] overflow-hidden rounded-2xl border border-white/10 bg-[rgba(23,24,38,0.6)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_16px_45px_rgba(0,0,0,0.35)] backdrop-blur-[12px]">
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex rounded-full border border-white/10 bg-slate-950/80 p-1">
          <TabButton isActive={activeTab === "resources"} onClick={() => setActiveTab("resources")}>
            Resources
          </TabButton>
          <TabButton isActive={activeTab === "overview"} onClick={() => setActiveTab("overview")}>
            Overview
          </TabButton>
          <TabButton isActive={activeTab === "status"} onClick={() => setActiveTab("status")}>
            Status
          </TabButton>
        </div>

        <select
          value={nodeStatus}
          onChange={(event) => setNodeStatus(event.target.value)}
          className="rounded-lg border border-white/10 bg-slate-950 px-2.5 py-1.5 text-sm text-slate-200 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/25"
        >
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>
      </div>

      <div className="mt-4 h-[660px] overflow-y-auto pr-1">
        {!selectedNode ? (
          <p className="rounded-xl border border-white/10 bg-slate-950/60 p-3 text-sm text-slate-400">
            Click a roadmap node to see its details, resources, and progress.
          </p>
        ) : (
          <div className="space-y-4">
            <header className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Selected Topic</p>
              <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-100">{selectedNode.data?.label || "Untitled"}</h3>
            </header>

            {activeTab === "overview" ? (
              <section className="rounded-xl border border-white/10 bg-slate-950/60 p-3 text-sm leading-7 text-slate-200 transition-all">
                {summaryText}
              </section>
            ) : null}

            {activeTab === "resources" ? (
              <section className="space-y-2 transition-all">
                {resourceLinks.map((item) => (
                  <LinkCard key={item.key} item={item} />
                ))}
              </section>
            ) : null}

            {activeTab === "status" ? (
              <section className="space-y-3 rounded-xl border border-white/10 bg-slate-950/60 p-3 transition-all">
                <p className="text-sm text-slate-300">
                  Track your progress for this topic and nearby connected topics.
                </p>
                <p className="text-sm">
                  Current status: <span className="font-semibold text-violet-300">{nodeStatus}</span>
                </p>
              </section>
            ) : null}

            <section className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Related Topics</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {relatedNodes.length ? (
                  relatedNodes.map((node) => (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => onSelectNode(node.id)}
                      className="rounded-full border border-slate-600 bg-slate-900 px-3 py-1 text-xs text-slate-200 transition hover:border-violet-400 hover:text-white"
                    >
                      {node.data?.label || node.id}
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No directly connected topics found.</p>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </aside>
  );
}
