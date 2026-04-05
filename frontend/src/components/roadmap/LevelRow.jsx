"use client";

import { Connector } from "@/components/roadmap/Connector";
import { NodeCard } from "@/components/roadmap/NodeCard";

function isOptionalPath(node) {
  const legend = String(node?.data?.legend?.label || "").toLowerCase();
  return legend.includes("alternative") || legend.includes("order not strict");
}

function getNodeStatus(node, completedIds, ancestorCompleted) {
  const isDone = completedIds.has(node.id);
  if (isDone) return "completed";
  if (!ancestorCompleted) return "locked";
  return "pending";
}

export function LevelRow({ nodes, level = 1, selectedId, completedIds, parentCompleted = true, onNodeClick }) {
  const showTopHorizontal = nodes.length > 1;

  return (
    <div className="relative pt-5">
      {showTopHorizontal ? <div className="absolute left-8 right-8 top-0 border-t-2 border-slate-400/75" /> : null}

      <div className="flex flex-wrap items-start justify-center gap-6">
        {nodes.map((node) => {
          const status = getNodeStatus(node, completedIds, parentCompleted);
          const isLocked = status === "locked";
          const children = (node.children || []).slice(0, 6);

          return (
            <div key={node.id} className="relative flex max-w-[330px] flex-col items-center">
              {showTopHorizontal ? (
                <div className="absolute -top-5">
                  <Connector orientation="vertical" length={20} dashed={isOptionalPath(node)} />
                </div>
              ) : null}

              <NodeCard
                label={node.data?.label}
                size={level === 0 ? "main" : "subtopic"}
                status={status}
                selected={selectedId === node.id}
                onClick={() => onNodeClick(node, isLocked)}
              />

              {children.length ? (
                <>
                  <div className="mt-2">
                    <Connector orientation="vertical" length={16} />
                  </div>
                  <div className="relative w-full rounded-xl border border-slate-300 bg-white/75 p-3">
                    {children.length > 1 ? <div className="absolute left-6 right-6 top-0 border-t-2 border-slate-400/70" /> : null}

                    <div className="mt-2 flex flex-wrap justify-center gap-2">
                      {children.map((child) => {
                        const childStatus = getNodeStatus(child, completedIds, status === "completed");
                        const childLocked = childStatus === "locked";
                        return (
                          <div key={child.id} className="flex flex-col items-center">
                            {children.length > 1 ? <Connector orientation="vertical" length={12} dashed={isOptionalPath(child)} /> : null}
                            <NodeCard
                              label={child.data?.label}
                              size="subtopic"
                              status={childStatus}
                              selected={selectedId === child.id}
                              onClick={() => onNodeClick(child, childLocked)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
