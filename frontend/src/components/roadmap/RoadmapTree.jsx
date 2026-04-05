"use client";

import { useEffect, useMemo, useState } from "react";
import { Connector } from "@/components/roadmap/Connector";
import { NodeCard } from "@/components/roadmap/NodeCard";
import { RightPanel } from "@/components/roadmap/RightPanel";

const ROADMAP_PROGRESS_STORAGE_KEY = "skillsync_roadmap_progress";
const ROADMAP_PROGRESS_UPDATED_EVENT = "skillsync-roadmap-progress-updated";

function getRoleStorageKey(roleLabel) {
  return String(roleLabel || "frontend")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
}

function readStoredRoadmapProgress() {
  if (typeof window === "undefined") {
    return { activeRoleKey: null, snapshots: {} };
  }

  try {
    const raw = window.localStorage.getItem(ROADMAP_PROGRESS_STORAGE_KEY);
    if (!raw) return { activeRoleKey: null, snapshots: {} };

    const parsed = JSON.parse(raw);
    return {
      activeRoleKey: typeof parsed?.activeRoleKey === "string" ? parsed.activeRoleKey : null,
      snapshots: parsed?.snapshots && typeof parsed.snapshots === "object" ? parsed.snapshots : {},
    };
  } catch {
    return { activeRoleKey: null, snapshots: {} };
  }
}

function sanitizeProgress(progressById, nodeLookup) {
  if (!progressById || typeof progressById !== "object") return {};

  return Object.fromEntries(
    Object.entries(progressById).filter(([nodeId, status]) => {
      return nodeLookup.has(nodeId) && ["not_started", "in_progress", "completed"].includes(status);
    })
  );
}

function cleanLabel(node) {
  const label = String(node?.data?.label || "").trim();
  if (!label || label.toLowerCase() === "vertical node") return "";
  return label;
}

function shouldIncludeNode(node) {
  if (!cleanLabel(node)) return false;
  const kind = String(node?.data?.kind || "").toLowerCase();
  return kind !== "vertical";
}

function isOptionalPath(node) {
  const legend = String(node?.data?.legend?.label || "").toLowerCase();
  return legend.includes("alternative") || legend.includes("order not strict");
}

function collectDescendants(id, childrenMap, bag) {
  const children = childrenMap.get(id) || [];
  children.forEach((childId) => {
    if (bag.has(childId)) return;
    bag.add(childId);
    collectDescendants(childId, childrenMap, bag);
  });
}

function buildUnifiedTree(nodes, edges) {
  const filteredNodes = (nodes || []).filter(shouldIncludeNode);
  const nodeMap = new Map(filteredNodes.map((node) => [node.id, node]));
  const childrenMap = new Map();
  const parentMap = new Map();
  const parentCount = new Map();

  filteredNodes.forEach((node) => {
    childrenMap.set(node.id, []);
    parentMap.set(node.id, []);
    parentCount.set(node.id, 0);
  });

  (edges || []).forEach((edge) => {
    if (!nodeMap.has(edge.source) || !nodeMap.has(edge.target)) return;
    childrenMap.get(edge.source).push(edge.target);
    parentMap.get(edge.target).push(edge.source);
    parentCount.set(edge.target, (parentCount.get(edge.target) || 0) + 1);
  });

  const sortByPosition = (a, b) => {
    const ay = Number(a?.position?.y || 0);
    const by = Number(b?.position?.y || 0);
    if (ay !== by) return ay - by;
    return Number(a?.position?.x || 0) - Number(b?.position?.x || 0);
  };

  const pickBackendParent = filteredNodes.find((node) => cleanLabel(node).toLowerCase() === "pick a backend language");
  if (pickBackendParent) {
    const languageNames = new Set(["javascript", "go", "python"]);
    const descendants = new Set();
    collectDescendants(pickBackendParent.id, childrenMap, descendants);

    filteredNodes.forEach((node) => {
      if (node.id === pickBackendParent.id) return;
      const lower = cleanLabel(node).toLowerCase();
      if (!languageNames.has(lower) || descendants.has(node.id)) return;

      childrenMap.get(pickBackendParent.id).push(node.id);
      parentMap.get(node.id).push(pickBackendParent.id);
      parentCount.set(node.id, (parentCount.get(node.id) || 0) + 1);
    });
  }

  const roots = filteredNodes.filter((node) => (parentCount.get(node.id) || 0) === 0).sort(sortByPosition);
  const visited = new Set();

  const buildNode = (id, depth = 0) => {
    if (!nodeMap.has(id) || depth > 4 || visited.has(`${id}-${depth}`)) return null;
    visited.add(`${id}-${depth}`);

    const source = nodeMap.get(id);
    const children = (childrenMap.get(id) || [])
      .map((childId) => buildNode(childId, depth + 1))
      .filter(Boolean)
      .slice(0, depth === 0 ? 10 : 8);

    return {
      ...source,
      data: {
        ...source.data,
        label: cleanLabel(source),
      },
      children,
    };
  };

  const root = {
    id: "__root__",
    data: { label: "Roadmap" },
    children: roots.map((rootNode) => buildNode(rootNode.id)).filter(Boolean),
  };

  const nodeLookup = new Map();
  const indexTree = (node) => {
    if (!node || node.id === "__root__") {
      (node?.children || []).forEach(indexTree);
      return;
    }
    nodeLookup.set(node.id, node);
    (node.children || []).forEach(indexTree);
  };
  indexTree(root);

  return { root, nodeLookup, childrenMap, parentMap };
}

function summaryForNode(node, roleLabel, relatedNames) {
  if (!node) return "";
  const title = node.data?.label || "Topic";
  const fromData = String(node.data?.description || "").trim();
  if (fromData) return fromData;

  const nearby = relatedNames.slice(0, 5).join(", ");
  if (!nearby) return `${title} is an important step in the ${roleLabel} roadmap. Build practical projects while learning this topic.`;
  return `${title} is part of your ${roleLabel} path. It is closely related to ${nearby}. Learn fundamentals, then apply with project-based practice.`;
}

function mapStatusToPanelLabel(status) {
  if (status === "completed") return "Done";
  if (status === "in_progress") return "In Progress";
  return "Pending";
}

function mapPanelLabelToStatus(label) {
  if (label === "Done") return "completed";
  if (label === "In Progress") return "in_progress";
  return "not_started";
}

function Branch({ node, level, isRoot, progressById, selectedId, onNodeClick, ancestorUnlocked }) {
  const explicit = progressById[node.id] || "not_started";
  const done = explicit === "completed";
  const inProgress = explicit === "in_progress";
  const locked = !isRoot && !done && !inProgress && !ancestorUnlocked;
  const status = locked ? "locked" : explicit;
  const children = node.children || [];

  return (
    <div className="flex w-full flex-col items-center">
      {!isRoot ? (
        <NodeCard
          label={node.data?.label}
          size={level <= 1 ? "main" : "subtopic"}
          status={status}
          selected={selectedId === node.id}
          onClick={() => onNodeClick(node, locked)}
        />
      ) : null}

      {children.length ? (
        <>
          <div className="mt-3">
            <Connector orientation="vertical" length={20} />
          </div>

          <div className="relative mt-1 w-full px-2">
            {children.length > 1 ? (
              <div className="mx-auto mb-1 w-[calc(100%-3rem)] rounded-full border-t-2 border-[rgba(148,163,184,0.3)]" />
            ) : null}

            <div className="flex flex-wrap items-start justify-center gap-4 md:gap-6">
              {children.map((child) => (
                <div key={child.id} className="flex max-w-[340px] flex-col items-center">
                  {children.length > 1 ? <Connector orientation="vertical" length={12} dashed={isOptionalPath(child)} /> : null}
                  <Branch
                    node={child}
                    level={level + 1}
                    isRoot={false}
                    progressById={progressById}
                    selectedId={selectedId}
                    onNodeClick={onNodeClick}
                    ancestorUnlocked={done || inProgress || ancestorUnlocked || isRoot}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function RoadmapTree({ nodes, edges, roleLabel }) {
  const [selectedId, setSelectedId] = useState(null);
  const [progressById, setProgressById] = useState({});
  const [activeTab, setActiveTab] = useState("resources");
  const [hasHydratedProgress, setHasHydratedProgress] = useState(false);
  const { root, nodeLookup, childrenMap, parentMap } = useMemo(() => buildUnifiedTree(nodes, edges), [nodes, edges]);
  const selectedNode = selectedId ? nodeLookup.get(selectedId) : null;
  const roleStorageKey = useMemo(() => getRoleStorageKey(roleLabel), [roleLabel]);

  useEffect(() => {
    setHasHydratedProgress(false);

    const stored = readStoredRoadmapProgress();
    const snapshot = stored.snapshots?.[roleStorageKey];
    const nextProgress = sanitizeProgress(snapshot?.progressById, nodeLookup);
    const nextSelectedId =
      snapshot?.selectedId && nodeLookup.has(snapshot.selectedId) ? snapshot.selectedId : root.children?.[0]?.id || null;

    setProgressById(nextProgress);
    setSelectedId(nextSelectedId);
    setHasHydratedProgress(true);
  }, [nodeLookup, roleStorageKey, root]);

  useEffect(() => {
    if (!hasHydratedProgress || typeof window === "undefined") return;

    const statuses = Object.values(progressById);
    const totalTasks = nodeLookup.size;
    const completedTasks = statuses.filter((status) => status === "completed").length;
    const inProgressTasks = statuses.filter((status) => status === "in_progress").length;
    const notStartedTasks = Math.max(0, totalTasks - completedTasks - inProgressTasks);
    const pendingTasks = Math.max(0, totalTasks - completedTasks);
    const overallProgress = totalTasks ? Math.round(((completedTasks + inProgressTasks * 0.5) / totalTasks) * 100) : 0;

    const snapshot = {
      roleKey: roleStorageKey,
      roleLabel,
      selectedId,
      progressById,
      totalTasks,
      completedTasks,
      inProgressTasks,
      notStartedTasks,
      pendingTasks,
      overallProgress,
      updatedAt: new Date().toISOString(),
    };

    const stored = readStoredRoadmapProgress();
    const nextStore = {
      activeRoleKey: roleStorageKey,
      snapshots: {
        ...stored.snapshots,
        [roleStorageKey]: snapshot,
      },
    };

    window.localStorage.setItem(ROADMAP_PROGRESS_STORAGE_KEY, JSON.stringify(nextStore));
    window.dispatchEvent(new CustomEvent(ROADMAP_PROGRESS_UPDATED_EVENT, { detail: snapshot }));
  }, [hasHydratedProgress, nodeLookup.size, progressById, roleLabel, roleStorageKey, selectedId]);

  const onNodeClick = (node, isLocked) => {
    setSelectedId(node.id);
    if (isLocked) return;

    setProgressById((prev) => {
      const current = prev[node.id] || "not_started";
      const next = current === "not_started" ? "in_progress" : current === "in_progress" ? "completed" : "not_started";
      return { ...prev, [node.id]: next };
    });
  };

  const relatedNodes = useMemo(() => {
    if (!selectedId) return [];
    const relatedIds = new Set([...(childrenMap.get(selectedId) || []), ...(parentMap.get(selectedId) || [])]);
    return Array.from(relatedIds).map((id) => nodeLookup.get(id)).filter(Boolean).slice(0, 10);
  }, [childrenMap, nodeLookup, parentMap, selectedId]);

  const summaryText = useMemo(() => {
    const relatedNames = relatedNodes.map((node) => node?.data?.label).filter(Boolean);
    return summaryForNode(selectedNode, roleLabel, relatedNames);
  }, [relatedNodes, roleLabel, selectedNode]);

  const resourceLinks = useMemo(() => {
    if (!selectedNode) return [];
    const fromResources = Array.isArray(selectedNode.data?.resources)
      ? selectedNode.data.resources.map((resource, index) => ({
          key: `res-${index}`,
          title: typeof resource === "string" ? resource : resource?.title || `Resource ${index + 1}`,
          url: typeof resource === "string" ? null : resource?.url || null,
          tag: "Official",
        }))
      : [];

    const relatedLinks = relatedNodes
      .map((node) => ({
        key: `related-${node.id}`,
        title: node.data?.label || "Related Topic",
        url: node.data?.href || node.data?.url || null,
        tag: "Related",
      }))
      .filter((item) => item.url);

    const fallback = [
      {
        key: "fallback-rm",
        title: `Search ${selectedNode.data?.label || "topic"} on roadmap.sh`,
        url: `https://roadmap.sh/search?q=${encodeURIComponent(selectedNode.data?.label || "")}`,
        tag: "Explore",
      },
    ];

    return [...fromResources, ...relatedLinks, ...(!fromResources.length && !relatedLinks.length ? fallback : [])];
  }, [relatedNodes, selectedNode]);

  const selectedStatus = selectedNode ? progressById[selectedNode.id] || "not_started" : "not_started";
  const nodeStatusLabel = mapStatusToPanelLabel(selectedStatus);

  return (
    <div
      className="rounded-2xl border border-white/10 bg-[linear-gradient(to_bottom,#111827,#1f1b2e)] p-4"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.15) 1px, transparent 0), radial-gradient(circle at 18% 0%, rgba(139,92,246,0.30), transparent 38%), radial-gradient(circle at 82% 14%, rgba(244,114,182,0.20), transparent 36%), radial-gradient(circle at 52% 100%, rgba(250,204,21,0.12), transparent 42%), linear-gradient(to bottom, #111827, #1f1b2e)",
        backgroundSize: "22px 22px, 100% 100%, 100% 100%, 100% 100%, 100% 100%",
      }}
    >
      <div className="mb-4 rounded-xl border border-white/10 bg-[rgba(20,24,38,0.65)] px-4 py-3 text-sm text-slate-200 backdrop-blur-[12px]">
        <p className="font-semibold text-slate-100">{roleLabel} Roadmap</p>
        <p className="mt-1 text-xs text-slate-400">Dark premium roadmap experience with connected flow and guided progress.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="relative max-h-[760px] overflow-y-auto rounded-xl border border-white/10 bg-[rgba(24,24,36,0.56)] p-4 backdrop-blur-[12px]">
          <div className="pointer-events-none absolute bottom-3 left-1/2 top-3 -translate-x-1/2">
            <Connector orientation="vertical" length="100%" className="border-violet-200/25" />
          </div>

          <div className="relative z-10 flex justify-center">
            {root.children?.length ? (
              <Branch
                node={root}
                level={0}
                isRoot
                progressById={progressById}
                selectedId={selectedId}
                onNodeClick={onNodeClick}
                ancestorUnlocked
              />
            ) : (
              <p className="text-sm text-slate-400">No roadmap nodes available for this role.</p>
            )}
          </div>
        </div>

        <RightPanel
          selectedNode={selectedNode}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          nodeStatus={nodeStatusLabel}
          setNodeStatus={(label) => {
            if (!selectedNode) return;
            const nextStatus = mapPanelLabelToStatus(label);
            setProgressById((prev) => ({ ...prev, [selectedNode.id]: nextStatus }));
          }}
          summaryText={summaryText}
          resourceLinks={resourceLinks}
          relatedNodes={relatedNodes}
          onSelectNode={setSelectedId}
        />
      </div>
    </div>
  );
}
