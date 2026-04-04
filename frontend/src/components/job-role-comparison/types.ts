export type RoleMatch = {
  name: string;
  match: number;
};

export type QuestionItem = {
  id: string;
  type: "text" | "mcq";
  category: string;
  question: string;
  options?: string[];
};

