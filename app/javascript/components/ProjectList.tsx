import React, { useEffect, useState } from 'react';
import { Project } from '../types/api';
import { ApiService } from '../types/generated/services.gen';
import '../lib/openapi-config'; // Configure OpenAPI client

/**
 * Example component showing how to use auto-generated API services
 * 
 * The Project type and API methods are automatically generated from:
 * - app/api/v1/entities/project.rb
 * - app/api/v1/projects_api.rb
 * 
 * Benefits:
 * - 100% auto-generated API methods
 * - Type-safe requests and responses
 * - Automatic CSRF token handling (via openapi-config)
 * - No manual API client code needed
 */

interface ProjectListProps {
  filter?: 'active' | 'completed' | 'draft';
}

const ProjectList: React.FC<ProjectListProps> = ({ filter }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        
        // ✅ Using auto-generated API service
        // TypeScript knows the exact return type!
        const data = await ApiService.getProjects();
        
        // Filter on client side if needed
        const filteredData = filter 
          ? data.filter((p: Project) => p.status === filter)
          : data;
        
        setProjects(filteredData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [filter]);

  if (loading) {
    return <div className="text-center py-8">Loading projects...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Error: {error}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No projects found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">
        Projects {filter && `(${filter})`}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
};

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  // TypeScript knows all these properties exist and their types!
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    draft: 'bg-gray-100 text-gray-800',
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {project.name}
        </h3>
        
        {/* TypeScript ensures status is one of: 'active' | 'completed' | 'draft' */}
        {project.status && (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
            {project.status}
          </span>
        )}
      </div>

      {project.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {project.description}
        </p>
      )}

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Budget:</span>
          <span className="font-medium">{formatCurrency(project.budget)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-500">Created:</span>
          <span className="font-medium">{formatDate(project.created_at)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-500">Updated:</span>
          <span className="font-medium">{formatDate(project.updated_at)}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <button className="w-full bg-brand-500 text-white py-2 rounded-lg hover:bg-brand-600 transition-colors">
          View Details
        </button>
      </div>
    </div>
  );
};

export default ProjectList;

