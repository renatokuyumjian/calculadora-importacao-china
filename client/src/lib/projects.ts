import { defaultPremises, defaultProduct, type PremiseInput, type ProductInput } from "@shared/nationalizationBasics";

export type Project = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  exchangeRate: number;
  premises: PremiseInput[];
  products: ProductInput[];
};

const STORAGE_KEY = "calc-importacao-projects";

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function listProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Project[];
  } catch {
    return [];
  }
}

export function getProject(id: string): Project | null {
  return listProjects().find(p => p.id === id) ?? null;
}

export function saveProject(project: Project): void {
  const projects = listProjects();
  const idx = projects.findIndex(p => p.id === project.id);
  const updated = { ...project, updatedAt: new Date().toISOString() };
  if (idx >= 0) {
    projects[idx] = updated;
  } else {
    projects.unshift(updated);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function deleteProject(id: string): void {
  const projects = listProjects().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function createProject(name: string): Project {
  const now = new Date().toISOString();
  return {
    id: uid(),
    name,
    createdAt: now,
    updatedAt: now,
    exchangeRate: 5.05,
    premises: defaultPremises.map(p => ({ ...p })),
    products: [{ ...defaultProduct, id: uid() }],
  };
}
