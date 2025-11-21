import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import type { Project } from '../types/api';
import '../lib/openapi-config';
import { useProjectsQuery } from '../queries/projects/useProjectsQuery';

/**
 * Sidebar Item Props
 */
interface SidebarItemProps {
  label: string;
  active?: boolean;
  icon?: React.ReactNode;
}

/**
 * Sidebar Item Component
 */
const SidebarItem: React.FC<SidebarItemProps> = ({ label, active = false, icon }) => (
  <div className={`group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
    active 
      ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/25' 
      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
  }`}>
    <div className={`flex h-6 w-6 items-center justify-center rounded-md ${
      active ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-brand-100'
    }`}>
      {icon || <span className={`h-2 w-2 rounded-full ${active ? 'bg-white' : 'bg-brand-500'}`}></span>}
    </div>
    <span>{label}</span>
  </div>
);

/**
 * Topbar Props
 */
interface TopbarProps {
  user: {
    name?: string;
    email?: string;
    image?: string;
  } | null;
  onLogout: () => void;
}

/**
 * Topbar Component
 */
const Topbar: React.FC<TopbarProps> = ({ user, onLogout }) => (
  <div className="bg-gradient-to-r from-white via-white to-brand-50/30 border-b border-gray-100/60 backdrop-blur-sm">
    <div className="flex items-center justify-between px-8 py-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good Morning{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          It is a long established fact that a reader will be distracted by the readable
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-full bg-brand-50 px-3 py-2">
          <div className="h-2 w-2 rounded-full bg-brand-500"></div>
          <span className="text-sm font-medium text-brand-700">Active</span>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">{user?.name || 'User'}</div>
          <div className="text-xs text-gray-500">{user?.email}</div>
        </div>
        {user?.image ? (
          <img alt="avatar" src={user.image} className="h-10 w-10 rounded-full border-2 border-white shadow-md" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold text-sm">
            {user?.name?.charAt(0) || 'U'}
          </div>
        )}
        <button
          onClick={onLogout}
          className="ml-2 rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          title="Logout"
        >
          Logout
        </button>
      </div>
    </div>
  </div>
);

/**
 * Stat Card Props
 */
interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  color?: 'blue' | 'green' | 'orange' | 'purple';
  trend?: string;
}

/**
 * Stat Card Component
 */
const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, color = 'blue', trend }) => {
  const colorMap: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-brand-500 to-brand-600', 
    orange: 'from-orange-400 to-orange-500',
    purple: 'from-purple-500 to-purple-600'
  };
  
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-soft-lg hover:shadow-soft-xl transition-all duration-300 border border-gray-100/50">
      <div className="relative z-10">
        <div className="text-sm font-medium text-gray-600">{title}</div>
        <div className="mt-2 text-3xl font-bold text-gray-900">{value}</div>
        {subtitle && <div className="mt-1 text-sm text-gray-500">{subtitle}</div>}
        {trend && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            <span className="text-brand-600">↗</span>
            <span className="font-medium text-brand-600">{trend}</span>
          </div>
        )}
      </div>
      <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${colorMap[color]} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}></div>
    </div>
  );
};

/**
 * Project Card Props
 */
interface ProjectCardProps {
  title: string;
  date: string;
  status?: 'Active' | 'Completed' | 'Draft';
}

/**
 * Project Card Component
 */
const ProjectCard: React.FC<ProjectCardProps> = ({ title, date, status = 'Active' }) => {
  const statusColors: Record<string, string> = {
    Active: 'bg-brand-500 text-white',
    Completed: 'bg-blue-100 text-blue-700',
    Draft: 'bg-gray-100 text-gray-600'
  };

  return (
    <div className="group relative overflow-hidden rounded-xl bg-white p-5 shadow-soft-lg hover:shadow-soft-xl transition-all duration-300 border border-gray-100/50 hover:border-brand-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors">{title}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
          {status}
        </span>
      </div>
      <p className="text-sm text-gray-500">{date}</p>
      <div className="absolute -right-2 -bottom-2 h-16 w-16 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  );
};

/**
 * Dashboard Page Component
 */
const DashboardPage: React.FC = () => {
  const { user, isLoading, isAuthenticated, logout, getAccessTokenSilently, loginWithRedirect } = useAuth0();
  const { data: projectsData, isLoading: projectsLoading, isFetching, error: projectsError } = useProjectsQuery({
    enabled: isAuthenticated,
  });
  const projects: Project[] = projectsData ?? [];
  const projectsErrorMessage = projectsError ? projectsError.message : null;

  // Automatically trigger login if not authenticated (e.g., coming from marketing page)
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect({
        appState: {
          returnTo: '/dashboard'
        }
      }).catch((error) => {
        console.error('Login redirect failed:', error);
      });
    }
  }, [isLoading, isAuthenticated, loginWithRedirect]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-brand-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {isLoading ? 'Loading...' : 'Redirecting to login...'}
          </p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const activeCount = projects.filter((project) => project.status === 'active').length;
  const completedCount = projects.filter((project) => project.status === 'completed').length;
  const draftCount = projects.filter((project) => project.status === 'draft').length;
  const totalBudget = projects.reduce<number>((sum, project) => sum + (project.budget ?? 0), 0);

  const formatStatusLabel = (status?: Project['status']): 'Active' | 'Completed' | 'Draft' => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'completed':
        return 'Completed';
      default:
        return 'Draft';
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) {
      return 'Unknown date';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const recentProjects = projects.slice(0, 6);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-brand-50/20">
      <Topbar user={user ?? null} onLogout={handleLogout} />
      <div className="mx-auto max-w-7xl px-8 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar */}
          <aside className="col-span-12 lg:col-span-3">
            <div className="sticky top-8">
              <div className="rounded-2xl bg-white/70 backdrop-blur-sm border border-gray-200/50 p-6 shadow-soft-lg">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">Script Generation</h2>
                  <p className="text-sm text-gray-500">Everything you need</p>
                </div>
                <nav className="space-y-2">
                  <SidebarItem label="Dashboard" active />
                  <SidebarItem label="Scripts" />
                  <SidebarItem label="Projects" />
                  <SidebarItem label="Props & VFX" />
                  <SidebarItem label="Call Sheets" />
                  <SidebarItem label="Expenses" />
                  <SidebarItem label="Approvals" />
                  <SidebarItem label="Members" />
                  <SidebarItem label="Settings" />
                </nav>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="col-span-12 lg:col-span-9">
            {/* Project Summary Section */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Project Summary</h2>
              {projectsErrorMessage && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {projectsErrorMessage}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  title="Active Projects" 
                  value={projectsLoading || isFetching ? '...' : activeCount.toString()} 
                  trend={projectsLoading || isFetching ? undefined : `${projects.length ? Math.round((activeCount / projects.length) * 100) : 0}% active`} 
                  color="green"
                />
                <StatCard 
                  title="Completed Projects" 
                  value={projectsLoading || isFetching ? '...' : completedCount.toString()} 
                  trend={projectsLoading || isFetching ? undefined : `${projects.length ? Math.round((completedCount / projects.length) * 100) : 0}% complete`} 
                  color="blue"
                />
                <StatCard 
                  title="Drafts Projects" 
                  value={projectsLoading || isFetching ? '...' : draftCount.toString()} 
                  subtitle={projectsLoading || isFetching ? undefined : `${projects.length ? Math.round((draftCount / projects.length) * 100) : 0}%`} 
                  color="purple"
                />
                <div className="rounded-2xl bg-white p-6 shadow-soft-lg border border-gray-100/50">
                  <div className="text-sm font-medium text-gray-600 mb-2">Budget for projects</div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {projectsLoading || isFetching ? '...' : `$${totalBudget.toLocaleString()}`}
                    <span className="text-lg font-normal text-gray-500">
                      {projectsLoading || isFetching ? '' : ' total'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mb-3">
                    {projectsLoading || isFetching
                      ? 'Fetching budget information...'
                      : 'Aggregated budget of all projects retrieved from the API.'}
                  </div>
                  
                  {/* Budget Chart Visualization */}
                  {projectsLoading || isFetching ? (
                    <div className="mt-6 flex h-16 items-center justify-center text-sm text-gray-500">
                      Loading project budgets...
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-4">
                      {recentProjects.length === 0 ? (
                        <div className="text-sm text-gray-500">
                          Add a project to see budget distribution.
                        </div>
                      ) : (
                        recentProjects.map((project) => {
                          const budget = project.budget ?? 0;
                          const height = Math.min(100, Math.max(10, Math.round(budget / Math.max(totalBudget, 1) * 100)));
                          return (
                            <div
                              key={project.id}
                              className="flex-1 rounded-lg bg-gradient-to-t from-blue-500 to-blue-400 flex items-end justify-center pb-2 transition-all hover:from-brand-500 hover:to-brand-400"
                              style={{ height: `${height}%` }}
                              title={`${project.name || 'Untitled'}: $${budget.toLocaleString()}`}
                            >
                              <span className="text-xs text-white font-medium">
                                ${budget.toLocaleString()}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-center mt-4">
                    <button className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
                      View all projects
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Projects */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Projects</h2>
              {projectsLoading || isFetching ? (
                <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 shadow-soft-lg">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
                  Loading projects...
                </div>
              ) : recentProjects.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-sm text-gray-500 shadow-soft-lg">
                  No projects found. Create a project to see it listed here.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {recentProjects.map((project) => (
                    <ProjectCard
                      key={project.id ?? project.name}
                      title={project.name || 'Untitled Project'}
                      date={formatDate(project.updated_at || project.created_at)}
                      status={formatStatusLabel(project.status)}
                    />
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

