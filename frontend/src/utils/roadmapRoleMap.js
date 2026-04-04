import frontendRoadmap from "@/data/frontend.json";
import backendRoadmap from "@/data/backend.json";
import aiEngineerRoadmap from "@/data/ai-engineer.json";

export const ROLE_OPTIONS = [
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "ai", label: "AI Data Scientist" },
];

const ROLE_TO_FILE = {
  frontend: "frontend.json",
  backend: "backend.json",
  ai: "ai-data-scientist.json",
};

const FILE_TO_DATA = {
  "frontend.json": frontendRoadmap,
  "backend.json": backendRoadmap,
  "ai-data-scientist.json": aiEngineerRoadmap,
};

export function getRoadmapFileForRole(role) {
  return ROLE_TO_FILE[role] ?? ROLE_TO_FILE.frontend;
}

export function getRoadmapDataForRole(role) {
  const fileName = getRoadmapFileForRole(role);
  return FILE_TO_DATA[fileName] ?? frontendRoadmap;
}

export function getRoleLabel(role) {
  return ROLE_OPTIONS.find((item) => item.value === role)?.label ?? "Frontend";
}
