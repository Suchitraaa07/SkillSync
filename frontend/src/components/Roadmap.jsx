"use client";

import { RoadmapTree } from "@/components/roadmap/RoadmapTree";

export function Roadmap({ nodes, edges, roleLabel = "Frontend" }) {
  return <RoadmapTree nodes={nodes} edges={edges} roleLabel={roleLabel} />;
}
