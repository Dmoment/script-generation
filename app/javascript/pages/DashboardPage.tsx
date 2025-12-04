import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import type { Project } from '../types/api';
import '../lib/openapi-config';
import { useProjectsQuery } from '../queries/projects/useProjectsQuery';
import LoadingScreen from '../components/LoadingScreen';

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
  <div className={`group flex items-center gap-3 px-4 py-3 text-sm font-mono uppercase tracking-wide transition-all duration-200 border-l-4 ${
    active 
      ? 'bg-black text-white border-black' 
      : 'text-gray-600 hover:bg-gray-100 hover:text-black border-transparent hover:border-gray-300'
  }`}>
    <div className={`flex h-5 w-5 items-center justify-center ${
      active ? 'text-white' : 'text-gray-400 group-hover:text-black'
    }`}>
      {icon || <div className={`h-2 w-2 bg-current ${active ? 'animate-pulse' : ''}`}></div>}
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
  <div className="bg-[#f5f1e8] border-b-2 border-black">
    <div className="flex items-center justify-between px-8 py-6">
      <div>
        <h1 className="text-3xl font-black text-[#333333] uppercase tracking-tight">
          System Status: <span className="text-green-600">Online</span>
        </h1>
        <p className="text-sm text-gray-600 font-mono mt-1 uppercase tracking-wide">
          Welcome back, {user?.name?.split(' ')[0] || 'User'}
        </p>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-4 py-2 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-bold uppercase tracking-wider text-black">Active Session</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold uppercase text-black">{user?.name || 'User'}</div>
            <div className="text-[10px] font-mono text-gray-500 uppercase">{user?.email}</div>
          </div>
          {user?.image ? (
            <img alt="avatar" src={user.image} className="h-28 w-24 border-2 border-black grayscale" />
          ) : (
            <img alt="avatar" src="/videos/boy_avatar.png" className="h-28 w-20" />
          )}
        </div>
        
        <button
          onClick={onLogout}
          className="ml-2 px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 border-black hover:bg-black hover:text-white transition-colors"
          title="Logout"
        >
          Eject
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
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100',
    green: 'bg-green-100', 
    orange: 'bg-orange-100',
    purple: 'bg-purple-100'
  };
  
  const accentColors: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500', 
    orange: 'bg-orange-500',
    purple: 'bg-purple-500'
  };
  
  return (
    <div className="group relative bg-white border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-200">
      <div className={`absolute top-4 right-4 w-3 h-3 ${accentColors[color]} border border-black`}></div>
      <div className="relative z-10">
        <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{title}</div>
        <div className="text-4xl font-black text-black tracking-tighter">{value}</div>
        {subtitle && <div className="mt-2 text-xs font-mono text-gray-600 border-t border-gray-200 pt-2 inline-block">{subtitle}</div>}
        {trend && (
          <div className="mt-3 flex items-center gap-1 text-xs font-bold uppercase">
            <span className="text-black">↗</span>
            <span className="text-black">{trend}</span>
          </div>
        )}
      </div>
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
  const statusStyles: Record<string, string> = {
    Active: 'bg-green-500 text-white border-green-600',
    Completed: 'bg-blue-500 text-white border-blue-600',
    Draft: 'bg-gray-200 text-gray-800 border-gray-300'
  };

  return (
    <div className="group relative bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg text-black group-hover:underline decoration-2 underline-offset-2">{title}</h3>
          <p className="text-xs font-mono text-gray-500 mt-1 uppercase">{date}</p>
        </div>
        <div className={`w-3 h-3 ${status === 'Active' ? 'bg-green-500' : status === 'Completed' ? 'bg-blue-500' : 'bg-gray-400'} border border-black`}></div>
      </div>
      
      <div className="flex justify-between items-end mt-4 border-t-2 border-gray-100 pt-4">
        <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 border border-black bg-gray-50">
          {status}
        </span>
        <button className="text-xs font-bold uppercase hover:bg-black hover:text-white px-2 py-1 transition-colors">
          Open →
        </button>
      </div>
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
    return <LoadingScreen />;
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
      return 'UNKNOWN';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).toUpperCase();
  };

  const recentProjects = projects.slice(0, 6);

  return (
    <div className="min-h-screen bg-[#f5f1e8]">
      <Topbar user={user ?? null} onLogout={handleLogout} />
      <div className="mx-auto max-w-7xl px-8 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar */}
          <aside className="col-span-12 lg:col-span-3">
            <div className="sticky top-8">
              <div className="bg-white border-2 border-black p-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="p-5 border-b-2 border-black bg-gray-50">
                  <h2 className="text-xl font-black text-black uppercase tracking-tighter">Command Center</h2>
                  <p className="text-xs font-mono text-gray-600 mt-1">V.2.4.0-STABLE</p>
                </div>
                <nav className="flex flex-col py-2">
                  <SidebarItem label="Overview" active />
                  <SidebarItem label="Script Database" />
                  <SidebarItem label="Production Log" />
                  <SidebarItem label="Assets & Props" />
                  <SidebarItem label="Cast & Crew" />
                  <SidebarItem label="Budget Control" />
                  <SidebarItem label="Approvals" />
                  <SidebarItem label="System Users" />
                  <SidebarItem label="Configuration" />
                </nav>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="col-span-12 lg:col-span-9">
            {/* Project Summary Section */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-black uppercase tracking-tight flex items-center gap-3">
                  <span className="w-4 h-4 bg-black"></span>
                  Production Metrics
                </h2>
                <div className="h-1 flex-1 bg-black mx-4 opacity-20"></div>
              </div>
              
              {projectsErrorMessage && (
                <div className="mb-6 border-2 border-red-500 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 uppercase tracking-wide">
                  Error: {projectsErrorMessage}
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  title="Active Productions" 
                  value={projectsLoading || isFetching ? '...' : activeCount.toString()} 
                  trend={projectsLoading || isFetching ? undefined : `${projects.length ? Math.round((activeCount / projects.length) * 100) : 0}% RUNNING`} 
                  color="green"
                />
                <StatCard 
                  title="Archived / Done" 
                  value={projectsLoading || isFetching ? '...' : completedCount.toString()} 
                  trend={projectsLoading || isFetching ? undefined : `${projects.length ? Math.round((completedCount / projects.length) * 100) : 0}% COMPLETED`} 
                  color="blue"
                />
                <StatCard 
                  title="Draft Concepts" 
                  value={projectsLoading || isFetching ? '...' : draftCount.toString()} 
                  subtitle={projectsLoading || isFetching ? undefined : `${projects.length ? Math.round((draftCount / projects.length) * 100) : 0}%`} 
                  color="purple"
                />
                
                {/* Budget Card */}
                <div className="bg-white border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-200">
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Total Budget Allocation</div>
                  <div className="text-2xl font-black text-black tracking-tighter mb-1">
                    {projectsLoading || isFetching ? '...' : `$${totalBudget.toLocaleString()}`}
                  </div>
                  <div className="text-[10px] font-mono text-gray-500 mb-4 uppercase">
                    {projectsLoading || isFetching ? 'SYNCING...' : 'AGGREGATED ACROSS ALL UNITS'}
                  </div>
                  
                  {/* Budget Visualization - Retro Bar */}
                  {projectsLoading || isFetching ? (
                    <div className="h-12 w-full bg-gray-100 animate-pulse border border-gray-200"></div>
                  ) : (
                    <div className="flex w-full h-12 border border-black bg-gray-50">
                      {recentProjects.length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-mono uppercase text-gray-400">
                          No Data
                        </div>
                      ) : (
                        recentProjects.map((project, idx) => {
                          const budget = project.budget ?? 0;
                          const widthPercent = Math.max(5, Math.round(budget / Math.max(totalBudget, 1) * 100));
                          // Cycle through retro patterns/colors
                          const patterns = ['bg-black', 'bg-gray-400', 'bg-gray-800', 'bg-gray-200'];
                          const patternClass = patterns[idx % patterns.length];
                          
                          return (
                            <div
                              key={project.id}
                              className={`h-full ${patternClass} border-r border-white last:border-r-0 relative group`}
                              style={{ width: `${widthPercent}%` }}
                              title={`${project.name}: $${budget.toLocaleString()}`}
                            >
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                  
                  <div className="mt-4 text-center">
                    <button className="text-xs font-bold uppercase tracking-widest border-b border-black hover:bg-black hover:text-white transition-all">
                      View Financials
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Projects */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-black uppercase tracking-tight flex items-center gap-3">
                  <span className="w-4 h-4 bg-black"></span>
                  Recent Deployments
                </h2>
                <div className="h-1 flex-1 bg-black mx-4 opacity-20"></div>
              </div>
              
              {projectsLoading || isFetching ? (
                <div className="flex items-center justify-center gap-3 border-2 border-black bg-white px-6 py-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="h-6 w-6 animate-spin border-4 border-black border-t-transparent rounded-full"></div>
                  <span className="font-mono text-sm uppercase font-bold">Retrieving Data...</span>
                </div>
              ) : recentProjects.length === 0 ? (
                <div className="border-2 border-dashed border-gray-400 bg-gray-50 px-6 py-12 text-center shadow-none">
                  <p className="font-mono text-sm text-gray-500 uppercase mb-4">No active deployments found in database.</p>
                  <button className="px-6 py-3 bg-black text-white font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors">
                    Initialize New Project
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {recentProjects.map((project) => (
                    <ProjectCard
                      key={project.id ?? project.name}
                      title={project.name || 'UNTITLED PROTOCOL'}
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

