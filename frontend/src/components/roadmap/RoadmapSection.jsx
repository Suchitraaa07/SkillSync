"use client";

import { ConnectorLines } from "@/components/roadmap/ConnectorLines";
import { RoadmapNode } from "@/components/roadmap/RoadmapNode";

function isOptionalPath(node) {
  const legend = String(node?.data?.legend?.label || "").toLowerCase();
  return legend.includes("alternative") || legend.includes("order not strict");
}

function BranchGroup({ parentNode, side = "left", completedIds, selectedId, onNodeClick, parentCompleted }) {
  const isParentDone = completedIds.has(parentNode.id);
  const parentLocked = !parentCompleted && !isParentDone;
  const parentStatus = isParentDone ? "completed" : parentLocked ? "locked" : "pending";
  const sideIsLeft = side === "left";
  const subChildren = (parentNode.children || []).slice(0, 5);

  return (
    <div className={`relative ${sideIsLeft ? "md:pr-10" : "md:pl-10"}`}>
      <div className={`absolute left-1/2 top-6 hidden md:block ${sideIsLeft ? "-ml-8" : "ml-0"}`}>
        <ConnectorLines orientation="horizontal" length={32} dashed={isOptionalPath(parentNode)} />
      </div>

      <div className={`flex ${sideIsLeft ? "md:justify-end" : "md:justify-start"} justify-center`}>
        <RoadmapNode
          label={parentNode.data?.label}
          size="subtopic"
          status={parentStatus}
          selected={selectedId === parentNode.id}
          onClick={() => onNodeClick(parentNode, parentLocked)}
        />
      </div>

      {subChildren.length ? (
        <div className={`relative mt-3 rounded-xl border border-slate-300 bg-white/75 p-3 ${sideIsLeft ? "md:mr-3" : "md:ml-3"}`}>
          <div className={`absolute -top-3 ${sideIsLeft ? "right-6" : "left-6"}`}>
            <ConnectorLines orientation="vertical" length={12} />
          </div>

          <div className="space-y-2">
            {subChildren.map((child) => {
              const childDone = completedIds.has(child.id);
              const childLocked = !isParentDone && !parentCompleted && !childDone;
              const childStatus = childDone ? "completed" : childLocked ? "locked" : "pending";

              return (
                <div key={child.id} className={`relative flex items-center gap-2 ${sideIsLeft ? "justify-end" : "justify-start"}`}>
                  <ConnectorLines orientation="horizontal" length={16} dashed={isOptionalPath(child)} />
                  <RoadmapNode
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
      ) : null}
    </div>
  );
}

export function RoadmapSection({ section, completedIds, selectedId, onNodeClick }) {
  const rootCompleted = completedIds.has(section.id);
  const rootStatus = rootCompleted ? "completed" : "pending";
  const children = section.children || [];
  const leftChildren = children.filter((_, index) => index % 2 === 0);
  const rightChildren = children.filter((_, index) => index % 2 === 1);

  return (
    <section className="relative rounded-2xl border border-slate-700/70 bg-slate-100/95 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
      <div className="relative flex justify-center">
        <RoadmapNode
          label={section.data?.label}
          size="main"
          status={rootStatus}
          selected={selectedId === section.id}
          onClick={() => onNodeClick(section, false)}
        />
      </div>

      {children.length ? (
        <>
          <div className="mt-2 flex justify-center">
            <ConnectorLines orientation="vertical" length={22} />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-4">
              {leftChildren.map((child) => (
                <BranchGroup
                  key={child.id}
                  parentNode={child}
                  side="left"
                  completedIds={completedIds}
                  selectedId={selectedId}
                  onNodeClick={onNodeClick}
                  parentCompleted={rootCompleted}
                />
              ))}
            </div>

            <div className="space-y-4">
              {rightChildren.map((child) => (
                <BranchGroup
                  key={child.id}
                  parentNode={child}
                  side="right"
                  completedIds={completedIds}
                  selectedId={selectedId}
                  onNodeClick={onNodeClick}
                  parentCompleted={rootCompleted}
                />
              ))}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
