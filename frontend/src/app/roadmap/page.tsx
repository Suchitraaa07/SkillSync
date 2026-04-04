"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { Card } from "@/components/Card";
import { Roadmap } from "@/components/Roadmap";
import { RoleSelector } from "@/components/RoleSelector";
import { convertToFlow } from "@/utils/convertRoadmap";
import { getRoadmapDataForRole, getRoadmapFileForRole, getRoleLabel } from "@/utils/roadmapRoleMap";

export default function RoadmapPage() {
  const [selectedRole, setSelectedRole] = useState("frontend");
  const selectedRoadmap = useMemo(() => getRoadmapDataForRole(selectedRole), [selectedRole]);
  const selectedFileName = useMemo(() => getRoadmapFileForRole(selectedRole), [selectedRole]);
  const selectedRoleLabel = useMemo(() => getRoleLabel(selectedRole), [selectedRole]);
  const { nodes, edges } = useMemo(() => convertToFlow(selectedRoadmap), [selectedRoadmap]);

  return (
    <AuthGuard>
      <AppShell>
        <Card title="Interactive Learning Roadmap">
          <div className="space-y-4">
            <RoleSelector value={selectedRole} onChange={setSelectedRole} />
            <Roadmap nodes={nodes} edges={edges} roleLabel={selectedRoleLabel} />
            <p className="text-xs text-slate-400">
              Source: <span className="font-medium text-slate-300">{selectedFileName}</span> | structured roadmap view | scroll to explore
            </p>
          </div>
        </Card>
      </AppShell>
    </AuthGuard>
  );
}
