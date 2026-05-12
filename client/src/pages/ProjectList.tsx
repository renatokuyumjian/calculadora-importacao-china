import { createProject, deleteProject, listProjects, saveProject, type Project } from "@/lib/projects";
import { calculateBasicNationalization } from "@shared/nationalizationBasics";
import { Calculator, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const brlFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const usdFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD" });

function brl(v: number) { return brlFmt.format(Number.isFinite(v) ? v : 0); }
function usd(v: number) { return usdFmt.format(Number.isFinite(v) ? v : 0); }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function ProjectCard({ project, onOpen, onDelete }: { project: Project; onOpen: () => void; onDelete: () => void }) {
  const result = calculateBasicNationalization({
    exchangeRate: project.exchangeRate,
    premises: project.premises,
    products: project.products,
  });

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="truncate text-base font-semibold text-slate-950">{project.name}</h3>
        <p className="text-sm text-slate-500">
          {project.products.length} {project.products.length === 1 ? "produto" : "produtos"}
          {" · "}FOB {usd(result.totalFobUsd)}
          {" · "}Custo nac. {brl(result.totalLandedCostBrl)}
        </p>
        <p className="text-xs text-slate-400">Modificado em {formatDate(project.updatedAt)}</p>
      </div>

      <div className="flex shrink-0 gap-2">
        <button
          className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          onClick={onOpen}
        >
          <Calculator className="h-4 w-4" /> Abrir
        </button>
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          onClick={onDelete}
          title="Excluir projeto"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function ProjectList() {
  const [, navigate] = useLocation();
  const [projects, setProjects] = useState<Project[]>(() => listProjects());
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  function handleCreate() {
    const name = newName.trim() || "Novo projeto";
    const project = createProject(name);
    saveProject(project);
    navigate(`/projeto/${project.id}`);
  }

  function handleDelete(id: string) {
    if (!confirm("Excluir este projeto? Esta ação não pode ser desfeita.")) return;
    deleteProject(id);
    setProjects(listProjects());
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Calculadora de Importação</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Projetos de nacionalização</h1>
          <p className="mt-2 text-slate-600">Cada projeto é uma cotação independente com seus próprios produtos e premissas.</p>
        </header>

        {/* New project form */}
        {creating ? (
          <div className="mb-6 flex gap-3 rounded-2xl border border-blue-200 bg-white p-4 shadow-sm">
            <input
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              placeholder="Nome do projeto"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setCreating(false); }}
              autoFocus
            />
            <button
              className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
              onClick={handleCreate}
            >
              Criar
            </button>
            <button
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              onClick={() => setCreating(false)}
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            className="mb-6 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
            onClick={() => { setCreating(true); setNewName(""); }}
          >
            <Plus className="h-4 w-4" /> Novo projeto
          </button>
        )}

        {/* Project list */}
        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Calculator className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="font-medium text-slate-500">Nenhum projeto ainda</p>
            <p className="mt-1 text-sm text-slate-400">Crie um novo projeto para começar a calcular.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={() => navigate(`/projeto/${project.id}`)}
                onDelete={() => handleDelete(project.id)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
