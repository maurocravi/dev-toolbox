"use client";

export interface Project {
  id: string;
  name: string;
  color: string;
  description: string;
  createdAt: string;
}

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
}

export default function ProjectCard({ project, onDelete }: ProjectCardProps) {
  return (
    <div className="project-card">
      <div className="project-card-header">
        <div className="project-color-dot" style={{ backgroundColor: project.color }} />
        <h3 className="project-card-title">{project.name}</h3>
      </div>
      {project.description && (
        <p className="project-card-desc">{project.description}</p>
      )}
      <div className="project-card-footer">
        <span className="project-card-date">
          Creado el {new Date(project.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
        </span>
        <button
          className="project-delete-btn"
          onClick={() => onDelete(project.id)}
          aria-label={`Eliminar proyecto ${project.name}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
