"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import ProjectModal, { ProjectFormData } from "../components/ProjectModal";
import ProjectDetailsModal from "../components/ProjectDetailsModal";
import ProjectCard from "../components/ProjectCard";
import PageHeader from "../components/PageHeader";
import ErrorBanner from "../components/ErrorBanner";
import { useConfirm } from "../components/ConfirmDialog";
import { dbToProject, projectToDb, type DbProject, type Project } from "../types";
import { createClient } from "@/lib/supabase/client";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export default function ProyectosPage() {
  const confirm = useConfirm();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Shows a transient error (for failed mutations); the initial-load error stays persistent
  const showError = useCallback((message: string) => {
    setError(message);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => setError(null), 6000);
  }, []);

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true);
        setError(null);
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from("projects")
          .select("*")
          .order("created_at", { ascending: false });

        if (fetchError) {
          console.error("Error fetching projects:", fetchError);
          setError("Error al cargar los proyectos.");
          setLoading(false);
          return;
        }

        const projectsList = (data as DbProject[]).map(dbToProject);
        setProjects(projectsList);
        setLoading(false);
      } catch (err) {
        console.error("Unexpected error fetching projects:", err);
        setError("Error al conectar con el servidor.");
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  const handleNewProject = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const handleEditProject = (id: string) => {
    const project = projects.find((p) => p.id === id);
    if (project) {
      setEditingProject(project);
      setIsModalOpen(true);
    }
  };

  const handleSaveProject = useCallback(async (data: ProjectFormData) => {
    const supabase = createClient();

    if (editingProject) {
      const updated: Project = {
        ...editingProject,
        name: data.name,
        color: data.color,
        description: data.description,
      };

      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      if (selectedProject?.id === updated.id) {
        setSelectedProject(updated);
      }
      setEditingProject(null);

      const { error: updateError } = await supabase
        .from("projects")
        .update({
          name: updated.name,
          color: updated.color,
          description: updated.description,
        })
        .eq("id", updated.id);

      if (updateError) {
        console.error("Error updating project:", updateError);
        showError("No se pudieron guardar los cambios del proyecto.");
        const { data: refreshed } = await supabase
          .from("projects")
          .select("*")
          .order("created_at", { ascending: false });
        if (refreshed) setProjects((refreshed as DbProject[]).map(dbToProject));
      }
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const tempId = generateId();
    const now = new Date().toISOString();

    const tempProject: Project = {
      id: tempId,
      name: data.name,
      color: data.color,
      description: data.description,
      createdAt: now,
      links: [],
      accounts: [],
      folders: [],
    };

    setProjects((prev) => [tempProject, ...prev]);

    const dbPayload = {
      ...projectToDb(tempProject),
      user_id: user?.id ?? null,
    };

    const { data: inserted, error: insertError } = await supabase
      .from("projects")
      .insert(dbPayload)
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting project:", insertError);
      setProjects((prev) => prev.filter((p) => p.id !== tempId));
      showError("No se pudo crear el proyecto. Probá de nuevo.");
      return;
    }

    const realProject = dbToProject(inserted as DbProject);
    setProjects((prev) =>
      prev.map((p) => (p.id === tempId ? realProject : p))
    );
  }, [editingProject, selectedProject, showError]);

  const handleDeleteProject = useCallback(async (id: string) => {
    const ok = await confirm({
      title: "Eliminar proyecto",
      message: "¿Seguro que querés eliminar este proyecto? Se borrarán también sus carpetas, links y cuentas. Esta acción no se puede deshacer.",
      variant: "danger",
    });
    if (!ok) return;

    setProjects((prev) => prev.filter((p) => p.id !== id));

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting project:", deleteError);
      showError("No se pudo eliminar el proyecto.");
      const { data } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setProjects((data as DbProject[]).map(dbToProject));
    }
  }, [showError, confirm]);

  const handleViewProject = (id: string) => {
    const project = projects.find((p) => p.id === id);
    if (project) setSelectedProject(project);
  };

  const handleUpdateProject = useCallback(async (updated: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelectedProject(updated);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("projects")
      .update({
        name: updated.name,
        color: updated.color,
        description: updated.description,
        links: updated.links,
        accounts: updated.accounts,
        folders: updated.folders,
      })
      .eq("id", updated.id);

    if (updateError) {
      console.error("Error updating project:", updateError);
      showError("No se pudieron guardar los cambios del proyecto.");
      const { data } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) {
        const restored = (data as DbProject[]).map(dbToProject);
        setProjects(restored);
        const restoredSelected = restored.find((p) => p.id === updated.id);
        if (restoredSelected) setSelectedProject(restoredSelected);
      }
    }
  }, [showError]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredProjects = normalizedQuery
    ? projects.filter((p) => {
        const haystack = [
          p.name,
          p.description,
          ...p.links.map((l) => l.label),
          ...p.accounts.map((a) => a.name),
          ...p.folders.map((f) => f.name),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      })
    : projects;

  return (
    <div className="min-h-screen flex justify-center py-8 px-4 bg-[var(--background)]"
      style={{
        background: "radial-gradient(ellipse at 20% 0%, rgba(99, 102, 241, 0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(16, 185, 129, 0.04) 0%, transparent 60%), var(--background)",
      }}
    >
      <div className="w-full max-w-[800px] xl:max-w-[1040px]">
        <PageHeader
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          }
          title="Proyectos"
          subtitle="Organiza tus proyectos y tareas"
          right={
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[0.8125rem] font-semibold border-none bg-[var(--accent)] text-white cursor-pointer transition-all duration-200 font-[inherit] shadow-[0_2px_12px_rgba(99,102,241,0.3)] hover:bg-[var(--accent-hover)] hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:-translate-y-px"
              onClick={handleNewProject}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Nuevo Proyecto
            </button>
          }
        />

        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

        {/* Loading state */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-7 h-7 border-[3px] border-[rgba(99,102,241,0.2)] border-t-[var(--accent)] rounded-full animate-spin" />
            <p className="text-sm text-neutral-500 mt-3">Cargando proyectos...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[#3a3a44] mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-neutral-400 mb-1">No hay proyectos aún</h3>
            <p className="text-xs text-neutral-600">Comienza creando tu primer proyecto para organizar tu trabajo.</p>
          </div>
        ) : (
          <>
            {/* Search bar */}
            <div className="relative mb-4">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl pl-10 pr-10 py-2.5 text-[0.8125rem] text-[var(--foreground)] outline-none transition-all duration-150 font-[inherit] placeholder:text-zinc-600 focus:border-[var(--accent)] focus:shadow-[0_0_0_2px_rgba(99,102,241,0.1)]"
                type="text"
                placeholder="Buscar proyectos..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Buscar proyectos"
              />
              {query && (
                <button
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-md bg-transparent border-none text-zinc-500 cursor-pointer transition-all duration-150 hover:bg-white/6 hover:text-[var(--foreground)]"
                  onClick={() => setQuery("")}
                  aria-label="Limpiar búsqueda"
                  title="Limpiar búsqueda"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            {filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[#3a3a44] mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-neutral-400 mb-1">Sin resultados</h3>
                <p className="text-xs text-neutral-600">No hay proyectos que coincidan con &quot;{query}&quot;.</p>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onDelete={handleDeleteProject}
                    onView={handleViewProject}
                    onEdit={handleEditProject}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProject(null);
        }}
        onSave={handleSaveProject}
        project={editingProject}
      />

      {selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onUpdate={handleUpdateProject}
        />
      )}
    </div>
  );
}
