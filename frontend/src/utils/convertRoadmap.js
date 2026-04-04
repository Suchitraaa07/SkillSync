const CHILD_KEYS = ["children", "items", "topics", "subtopics", "steps"];

function getNodeLabel(node) {
  if (!node || typeof node !== "object") return "";
  return (
    node.title ||
    node.name ||
    node.label ||
    node.data?.label ||
    node.text ||
    ""
  );
}

function getNodeChildren(node) {
  if (!node || typeof node !== "object") return [];

  for (const key of CHILD_KEYS) {
    if (Array.isArray(node[key])) return node[key];
  }

  return [];
}

function createPosition(index, depth) {
  const x = depth * 380 + (index % 3) * 40;
  const y = index * 150 + (depth % 2) * 30;
  return { x, y };
}

function normalizeNodeId(rawId, fallbackId, seenIds) {
  const baseId = String(rawId ?? fallbackId);
  if (!seenIds.has(baseId)) {
    seenIds.add(baseId);
    return baseId;
  }

  let suffix = 1;
  let nextId = `${baseId}-${suffix}`;
  while (seenIds.has(nextId)) {
    suffix += 1;
    nextId = `${baseId}-${suffix}`;
  }
  seenIds.add(nextId);
  return nextId;
}

function convertFromExistingFlow(roadmapJson) {
  const sourceNodes = Array.isArray(roadmapJson?.nodes) ? roadmapJson.nodes : [];
  const sourceEdges = Array.isArray(roadmapJson?.edges) ? roadmapJson.edges : [];
  const seenIds = new Set();

  const nodes = sourceNodes.map((node, index) => {
    const id = normalizeNodeId(node?.id, `node-${index}`, seenIds);
    const nodeData = node && typeof node.data === "object" ? node.data : {};
    const label = getNodeLabel(node) || `Step ${index + 1}`;
    const position = node?.position ?? createPosition(index, Math.floor(index / 12));
    const scaledPosition = {
      x: Number(position?.x ?? 0) * 1.12,
      y: Number(position?.y ?? 0) * 1.12,
    };
    const href = node?.href || nodeData?.href || null;
    const url = node?.url || nodeData?.url || null;
    const resources = Array.isArray(nodeData?.resources) ? nodeData.resources : [];
    const description = nodeData?.description || nodeData?.text || nodeData?.content || "";

    return {
      id,
      data: {
        label,
        kind: node?.type || "node",
        description,
        legend: nodeData?.legend || null,
        resources,
        href,
        url,
        raw: nodeData,
      },
      position: scaledPosition,
      style: {
        borderRadius: 14,
        border: "1px solid #334155",
        padding: 12,
        fontSize: 12,
        color: "#e2e8f0",
        background: "#1f2937",
        maxWidth: 260,
      },
    };
  });

  const validNodeIds = new Set(nodes.map((node) => node.id));
  const edges = sourceEdges
    .map((edge, index) => {
      const source = String(edge?.source ?? "");
      const target = String(edge?.target ?? "");
      if (!validNodeIds.has(source) || !validNodeIds.has(target)) return null;

      return {
        id: String(edge?.id ?? `edge-${source}-${target}-${index}`),
        source,
        target,
      };
    })
    .filter(Boolean);

  return { nodes, edges };
}

function convertFromTree(roadmapJson) {
  const nodes = [];
  const edges = [];
  const seenIds = new Set();
  const depthCount = {};
  let sequence = 0;

  const walk = (current, parentId = null, depth = 0) => {
    if (!current || typeof current !== "object") return;

    const currentIndex = depthCount[depth] ?? 0;
    depthCount[depth] = currentIndex + 1;

    const id = normalizeNodeId(current.id, `node-${sequence++}`, seenIds);
    const label = getNodeLabel(current) || (depth === 0 ? "Roadmap" : "Untitled");
    const description = current?.description || current?.text || current?.content || "";
    const resources = Array.isArray(current?.resources) ? current.resources : [];
    const href = current?.href || null;
    const url = current?.url || null;

    nodes.push({
      id,
      data: {
        label,
        kind: current?.type || "node",
        description,
        legend: current?.legend || null,
        resources,
        href,
        url,
        raw: current,
      },
      position: createPosition(currentIndex, depth),
      style: {
        borderRadius: 14,
        border: "1px solid #334155",
        padding: 12,
        fontSize: 12,
        color: "#e2e8f0",
        background: "#1f2937",
        maxWidth: 260,
      },
    });

    if (parentId) {
      edges.push({
        id: `edge-${parentId}-${id}`,
        source: parentId,
        target: id,
      });
    }

    const children = getNodeChildren(current);
    children.forEach((child) => walk(child, id, depth + 1));
  };

  if (Array.isArray(roadmapJson)) {
    roadmapJson.forEach((item) => walk(item));
  } else {
    walk(roadmapJson);
  }

  return { nodes, edges };
}

export function convertToFlow(roadmapJson) {
  if (!roadmapJson) return { nodes: [], edges: [] };

  if (Array.isArray(roadmapJson?.nodes)) {
    return convertFromExistingFlow(roadmapJson);
  }

  return convertFromTree(roadmapJson);
}
