"use client";

import { useState, useEffect, useCallback } from "react";
import ProjectModal, { ProjectFormData } from "../components/ProjectModal";
import ProjectDetailsModal from "../components/ProjectDetailsModal";
import ProjectCard from "../components/ProjectCard";
import { dbToProject, projectToDb, type DbProject, type Project } from "../types";
import { getSupabase } from "../../lib/supabase";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export default function ProyectosPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true);
        setError(null);
        const { data, error: fetchError } = await getSupabase()
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
    setIsModalOpen(true);
  };

  const handleSaveProject = useCallback(async (data: ProjectFormData) => {
    const tempId = generateId();
    const now = new Date().toISOString();

    const tempProject: Project = {
      id: tempId,
      name: data.name,
      color: data.color,
      description: data.description,
      createdAt: now,
      links: [],
    };

    setProjects((prev) => [tempProject, ...prev]);

    const { data: inserted, error: insertError } = await getSupabase()
      .from("projects")
      .insert(projectToDb(tempProject))
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting project:", insertError);
      setProjects((prev) => prev.filter((p) => p.id !== tempId));
      return;
    }

    const realProject = dbToProject(inserted as DbProject);
    setProjects((prev) =>
      prev.map((p) => (p.id === tempId ? realProject : p))
    );
  }, []);

  const handleDeleteProject = useCallback(async (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));

    const { error: deleteError } = await getSupabase()
      .from("projects")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting project:", deleteError);
      const { data } = await getSupabase()
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setProjects((data as DbProject[]).map(dbToProject));
    }
  }, []);

  const handleViewProject = (id: string) => {
    const project = projects.find((p) => p.id === id);
    if (project) setSelectedProject(project);
  };

  const handleUpdateProject = useCallback(async (updated: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelectedProject(updated);

    const { error: updateError } = await getSupabase()
      .from("projects")
      .update({ links: updated.links })
      .eq("id", updated.id);

    if (updateError) {
      console.error("Error updating project links:", updateError);
      const { data } = await getSupabase()
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
  }, []);

  return (
    <div className="min-h-screen flex justify-center py-8 px-4 bg-[var(--background)]"
      style={{
        background: "radial-gradient(ellipse at 20% 0%, rgba(99, 102, 241, 0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(16, 185, 129, 0.04) 0%, transparent 60%), var(--background)",
      }}
    >
      <div className="w-full max-w-[800px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-[var(--card-border)]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[#8b5cf6] text-white flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-neutral-100">Proyectos</h1>
              <p className="text-xs text-neutral-500">Organiza tus proyectos y tareas</p>
            </div>
          </div>
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
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-xl px-4 py-3 mb-4 text-[0.8125rem] text-[var(--danger-hover)]">
            <span>{error}</span>
          </div>
        )}

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
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={handleDeleteProject}
                onView={handleViewProject}
              />
            ))}
          </div>
        )}
      </div>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProject}
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
