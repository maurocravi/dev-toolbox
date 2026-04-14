"use client";

import { useState } from "react";
import ProjectModal, { ProjectFormData } from "../components/ProjectModal";
import ProjectCard, { Project } from "../components/ProjectCard";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export default function ProyectosPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleNewProject = () => {
    setIsModalOpen(true);
  };

  const handleSaveProject = (data: ProjectFormData) => {
    const newProject: Project = {
      id: generateId(),
      name: data.name,
      color: data.color,
      description: data.description,
      createdAt: new Date().toISOString(),
    };
    setProjects((prev) => [newProject, ...prev]);
  };

  const handleDeleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="app-container">
      <div className="app-content proyectos-content">
        {/* Header */}
        <div className="app-header">
          <div className="flex items-center gap-3">
            <div className="app-logo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-neutral-100">Proyectos</h1>
              <p className="text-xs text-neutral-500">Organiza tus proyectos y tareas</p>
            </div>
          </div>
          <button className="btn btn-primary btn-new-project" onClick={handleNewProject}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nuevo Proyecto
          </button>
        </div>

        {/* Projects grid */}
        {projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-neutral-400 mb-1">No hay proyectos aún</h3>
            <p className="text-xs text-neutral-600">Comienza creando tu primer proyecto para organizar tu trabajo.</p>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={handleDeleteProject}
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
    </div>
  );
}
