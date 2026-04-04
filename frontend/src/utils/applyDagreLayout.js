import dagre from "dagre";

const DEFAULT_NODE_WIDTH = 190;
const DEFAULT_NODE_HEIGHT = 72;

export function applyDagreLayout(nodes, edges, options = {}) {
  const {
    direction = "TB",
    nodeSep = 56,
    rankSep = 92,
    marginX = 24,
    marginY = 24,
  } = options;

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: nodeSep,
    ranksep: rankSep,
    marginx: marginX,
    marginy: marginY,
  });

  nodes.forEach((node) => {
    const width = Number(node?.width || node?.style?.width || node?.measured?.width || DEFAULT_NODE_WIDTH);
    const height = Number(node?.height || node?.style?.height || node?.measured?.height || DEFAULT_NODE_HEIGHT);
    g.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    if (!g.hasNode(edge.source) || !g.hasNode(edge.target)) return;
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  return nodes.map((node) => {
    const dagreNode = g.node(node.id);
    const width = Number(node?.width || node?.style?.width || node?.measured?.width || DEFAULT_NODE_WIDTH);
    const height = Number(node?.height || node?.style?.height || node?.measured?.height || DEFAULT_NODE_HEIGHT);

    if (!dagreNode) return node;

    return {
      ...node,
      position: {
        x: dagreNode.x - width / 2,
        y: dagreNode.y - height / 2,
      },
      targetPosition: "top",
      sourcePosition: "bottom",
    };
  });
}
