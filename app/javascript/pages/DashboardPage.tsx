import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import type { Project } from '../types/api';
import '../lib/openapi-config';
import { useProjectsQuery } from '../queries/projects/useProjectsQuery';
import { useCreateProjectMutation } from '../queries/projects/useCreateProjectMutation';
import { useCurrentUserQuery } from '../queries/users/useCurrentUserQuery';
import { useOnboardingMutation, type OnboardingData } from '../queries/users/useOnboardingMutation';
import LoadingScreen from '../components/LoadingScreen';
import OnboardingModal from '../components/OnboardingModal';
import CreateProjectModal from '../components/CreateProjectModal';
import FilterDropdown from '../components/FilterDropdown';
import Pagination from '../components/Pagination';
import { colors, getColorWithOpacity } from '../lib/theme';

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
 * 
 * @param label - The text label to display (e.g., "Overview", "Script Database")
 * @param active - Boolean indicating if this is the currently selected/active menu item
 *                 When active=true: shows pink background (colors.primary.pink) with white text and left border
 *                 When active=false: shows gray text, becomes black on hover
 * @param icon - Optional React icon component to display next to the label
 */
const SidebarItem: React.FC<SidebarItemProps> = ({ label, active = false, icon }) => (
  <div 
    className={`group/item flex items-center gap-3 px-4 py-3 text-sm font-mono uppercase tracking-wide transition-all duration-200 border-l-4 ${
    active 
        ? 'text-white' 
      : 'text-gray-600 hover:bg-gray-100 hover:text-black border-transparent hover:border-gray-300'
    }`}
    style={active ? {
      backgroundColor: colors.primary.pink,
      borderColor: colors.primary.pink,
    } : {}}
  >
    {/* Icon container - always visible */}
    <div className={`flex h-5 w-5 items-center justify-center flex-shrink-0 ${
      active ? 'text-white' : 'text-gray-400 group-hover/item:text-black'
    }`}>
      {icon || <div className={`h-2 w-2 bg-current ${active ? 'animate-pulse' : ''}`}></div>}
    </div>
    {/* Label - hidden when collapsed, shown when sidebar is hovered */}
    <span className="sidebar-label whitespace-nowrap transition-all duration-300 inline-block opacity-0 ml-0 w-0 overflow-hidden group-hover/sidebar:opacity-100 group-hover/sidebar:w-[180px] group-hover/sidebar:ml-2">
      {label}
    </span>
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
  gender?: 'male' | 'female' | 'other' | null;
  onLogout: () => void;
}

/**
 * Get avatar based on gender
 */
const getAvatarByGender = (gender?: 'male' | 'female' | 'other' | null): string => {
  switch (gender) {
    case 'female':
      return '/videos/girl_avatar.png';
    case 'male':
    case 'other':
    default:
      return '/videos/boy_avatar.png';
  }
};

/**
 * Topbar Component
 */
const Topbar: React.FC<TopbarProps> = ({ user, gender, onLogout }) => (
  <div className="bg-[#FAF5ED] border-b-2 border-black relative">
    <div className="flex items-center justify-between px-8 py-6 relative z-10">
      <div className="absolute left-0 top-0 bottom-0 w-1/3 overflow-hidden">
        <img 
          src="/videos/dashboard_header.png" 
          alt="Dashboard Header" 
          className="h-full w-full object-cover object-left"
          style={{ transform: 'scale(1.0)', transformOrigin: 'left center' }}
        />
      </div>
      <div className="w-1/3"></div>
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
            <img alt="avatar" src={getAvatarByGender(gender)} className="h-28 w-20" />
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
 * Project List Item Component
 */
interface ProjectListItemProps {
  projectId: number | string;
  title: string;
  date: string;
  status?: 'Active' | 'Completed' | 'Draft';
  projectType?: string;
  updatedAt?: string;
  createdAt?: string;
  isSelected?: boolean;
  onSelect?: (id: number | string, selected: boolean) => void;
  onDelete?: () => void;
}

const ProjectListItem: React.FC<ProjectListItemProps> = ({ 
  projectId, 
  title, 
  date, 
  status = 'Active', 
  projectType, 
  updatedAt, 
  createdAt, 
  isSelected = false,
  onSelect,
  onDelete 
}) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'Active':
        return {
          bg: '#ECFDF5',
          text: '#047857',
          border: '#10B981',
        };
      case 'Completed':
        return {
          bg: '#EFF6FF',
          text: '#1E40AF',
          border: '#3B82F6',
        };
      default:
        return {
          bg: '#F9FAFB',
          text: '#6B7280',
          border: '#D1D5DB',
        };
    }
  };

  const statusStyles = getStatusStyles();

  return (
    <div className={`group bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150 ${isSelected ? 'bg-pink-50' : ''}`}>
      <div className="grid grid-cols-12 gap-4 px-6 py-2.5 items-center">
        {/* Checkbox Column */}
        <div className="col-span-1 flex items-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect?.(projectId, e.target.checked)}
            className="w-4 h-4 border-2 border-gray-300 rounded cursor-pointer focus:ring-2 focus:ring-pink-500 focus:ring-offset-1"
            style={{ accentColor: colors.primary.pink }}
          />
        </div>
        
        {/* Title Column */}
        <div className="col-span-4 min-w-0">
          <h3 className="font-medium text-sm text-gray-900 group-hover:text-black truncate">{title}</h3>
        </div>
        
        {/* Type Column */}
        <div className="col-span-2">
          <span className="text-sm text-gray-600">{projectType || '—'}</span>
        </div>
        
        {/* Status Column */}
        <div className="col-span-2">
          <span 
            className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded border"
            style={{
              backgroundColor: statusStyles.bg,
              color: statusStyles.text,
              borderColor: statusStyles.border,
              minWidth: '80px',
            }}
          >
            {status}
          </span>
        </div>
        
        {/* Updated Date Column */}
        <div className="col-span-2">
          <span className="text-sm text-gray-500">{date}</span>
        </div>
        
        {/* Actions Column */}
        <div className="col-span-1 flex justify-end gap-2">
          <button 
            onClick={(e) => e.stopPropagation()}
            className="text-xs font-medium text-gray-700 hover:text-black transition-colors px-2 py-1"
          >
            Open →
          </button>
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors px-2 py-1"
              title="Delete project"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Dashboard Page Component
 */
const DashboardPage: React.FC = () => {
  const { user, isLoading, isAuthenticated, logout, loginWithRedirect } = useAuth0();
  
  // Current user query to check onboarding status
  const { 
    data: currentUser, 
    isLoading: userLoading,
    error: userError 
  } = useCurrentUserQuery({
    enabled: isAuthenticated,
  });
  
  // Onboarding mutation
  const onboardingMutation = useOnboardingMutation();
  
  // Create project mutation
  const createProjectMutation = useCreateProjectMutation();
  const [showCreateProjectModal, setShowCreateProjectModal] = React.useState(false);
  
  // View and filter state - MUST be before any early returns
  const [viewMode, setViewMode] = React.useState<'card' | 'list'>('list');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [typeFilter, setTypeFilter] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  
  // Sorting state
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
  
  // Pagination state
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [perPage] = React.useState<number>(10); // Items per page
  
  // Bulk selection state
  const [selectedProjects, setSelectedProjects] = React.useState<Set<number | string>>(new Set());
  
  // Fetch all projects (we'll paginate client-side after filtering)
  const { data: projectsResponse, isLoading: projectsLoading, isFetching, error: projectsError } = useProjectsQuery({
    page: 1,
    per_page: 1000, // Fetch all for client-side filtering
    enabled: isAuthenticated && currentUser?.onboarding_completed === true,
  });
  
  // Extract projects from response (handle both old array format and new paginated format)
  const allProjects: Project[] = React.useMemo(() => {
    if (!projectsResponse) return [];
    
    // Check if it's the new paginated format (has 'data' key)
    if (typeof projectsResponse === 'object' && 'data' in projectsResponse && Array.isArray((projectsResponse as any).data)) {
      return (projectsResponse as any).data;
    }
    
    // Old format (array)
    if (Array.isArray(projectsResponse)) {
      return projectsResponse;
    }
    
    return [];
  }, [projectsResponse]);
  
  const projectsErrorMessage = projectsError ? projectsError.message : null;

  // Filter and sort projects - MUST be before any early returns (useMemo is a hook)
  const filteredProjects = React.useMemo(() => {
    let filtered = allProjects.filter((project) => {
      // Status filter
      if (statusFilter !== 'all' && project.status !== statusFilter) {
        return false;
      }
      
      // Type filter
      if (typeFilter !== 'all' && project.project_type?.toLowerCase() !== typeFilter.toLowerCase()) {
        return false;
      }
      
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = project.title?.toLowerCase().includes(query);
        const matchesType = project.project_type?.toLowerCase().includes(query);
        const matchesDescription = project.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesType && !matchesDescription) {
          return false;
        }
      }
      
      return true;
    });

    // Apply sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortColumn) {
          case 'title':
            aValue = a.title?.toLowerCase() || '';
            bValue = b.title?.toLowerCase() || '';
            break;
          case 'type':
            aValue = a.project_type?.toLowerCase() || '';
            bValue = b.project_type?.toLowerCase() || '';
            break;
          case 'status':
            aValue = a.status?.toLowerCase() || '';
            bValue = b.status?.toLowerCase() || '';
            break;
          case 'updated':
            aValue = new Date(a.updated_at || a.created_at || 0).getTime();
            bValue = new Date(b.updated_at || b.created_at || 0).getTime();
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [allProjects, statusFilter, typeFilter, searchQuery, sortColumn, sortDirection]);

  // Paginate filtered results
  const paginatedProjects = React.useMemo(() => {
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    return filteredProjects.slice(startIndex, endIndex);
  }, [filteredProjects, currentPage, perPage]);

  // Calculate pagination metadata
  const totalPages = Math.ceil(filteredProjects.length / perPage) || 1; // Always at least 1 page

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, typeFilter, searchQuery, sortColumn, sortDirection]);

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

  // Check if onboarding is required
  const showOnboarding = isAuthenticated && currentUser && !currentUser.onboarding_completed;

  // Handle onboarding completion
  const handleOnboardingComplete = async (data: OnboardingData) => {
    await onboardingMutation.mutateAsync(data);
  };

  // Handle project creation
  const handleCreateProject = async (data: { title: string; project_type: string }) => {
    try {
      await createProjectMutation.mutateAsync(data);
      setShowCreateProjectModal(false);
      // TODO: Navigate to project workspace or show success message
    } catch (error) {
      // Error is handled by the modal
      console.error('Failed to create project:', error);
    }
  };

  if (isLoading || !isAuthenticated || userLoading) {
    return <LoadingScreen />;
  }

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const activeCount = allProjects.filter((project) => project.status === 'active').length;
  const completedCount = allProjects.filter((project) => project.status === 'completed').length;
  const draftCount = allProjects.filter((project) => project.status === 'draft').length;
  const totalBudget = allProjects.reduce<number>((sum, project) => sum + (project.budget ?? 0), 0);

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

  return (
    <>
      <style>{`
        .group\\/sidebar:hover .sidebar-label {
          opacity: 1 !important;
          width: 180px !important;
          margin-left: 0.5rem !important;
        }
      `}</style>
      {/* Onboarding Modal - rendered at root level with portal-like behavior */}
      {showOnboarding && (
        <OnboardingModal
          onComplete={handleOnboardingComplete}
          isSubmitting={onboardingMutation.isPending}
          error={onboardingMutation.error?.message ?? null}
          initialName={user?.name || currentUser?.name || ''}
        />
      )}

      {/* Create Project Modal */}
      {showCreateProjectModal && (
        <CreateProjectModal
          onClose={() => setShowCreateProjectModal(false)}
          onCreate={handleCreateProject}
          isSubmitting={createProjectMutation.isPending}
          error={createProjectMutation.error?.message ?? null}
        />
      )}
      
      {/* Dashboard Content - blurred when onboarding modal is shown */}
      <div className={`min-h-screen bg-[#f5f1e8] flex ${showOnboarding ? 'blur-sm pointer-events-none select-none' : ''}`}>
        {/* Fixed Sidebar - Collapsible on hover */}
        <aside className="group/sidebar w-20 hover:w-64 flex-shrink-0 bg-white border-r-2 border-black h-screen sticky top-0 transition-all duration-300 ease-in-out">
          <div className="h-full flex flex-col">
            <div className="border-b-2 border-black bg-gray-50">
              <div className="px-5 pt-12 pb-6">
                <h2 className="text-xl font-black text-black uppercase tracking-tighter whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
                  Command Center
                </h2>
                <p className="text-xs font-mono text-gray-600 mt-1 whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
                  V.2.4.0-STABLE
                </p>
              </div>
                </div>
            <nav className="flex flex-col py-2 flex-1 overflow-y-auto">
              <SidebarItem 
                label="Overview" 
                active 
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                }
              />
              <SidebarItem 
                label="Script Database" 
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                }
              />
              <SidebarItem 
                label="Production Log" 
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              />
              <SidebarItem 
                label="Assets & Props" 
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                }
              />
              <SidebarItem 
                label="Cast & Crew" 
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
              />
              <SidebarItem 
                label="Budget Control" 
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <SidebarItem 
                label="Approvals" 
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <SidebarItem 
                label="System Users" 
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                }
              />
              <SidebarItem 
                label="Configuration" 
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
              />
                </nav>
            </div>
          </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar user={user ?? null} gender={currentUser?.gender} onLogout={handleLogout} />
          <main className="flex-1 px-8 py-8 overflow-y-auto">
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
                  trend={projectsLoading || isFetching ? undefined : `${allProjects.length ? Math.round((activeCount / allProjects.length) * 100) : 0}% RUNNING`} 
                  color="green"
                />
                <StatCard 
                  title="Archived / Done" 
                  value={projectsLoading || isFetching ? '...' : completedCount.toString()} 
                  trend={projectsLoading || isFetching ? undefined : `${allProjects.length ? Math.round((completedCount / allProjects.length) * 100) : 0}% COMPLETED`} 
                  color="blue"
                />
                <StatCard 
                  title="Draft Concepts" 
                  value={projectsLoading || isFetching ? '...' : draftCount.toString()} 
                  subtitle={projectsLoading || isFetching ? undefined : `${allProjects.length ? Math.round((draftCount / allProjects.length) * 100) : 0}%`} 
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
                      {allProjects.length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-mono uppercase text-gray-400">
                          No Data
                        </div>
                      ) : (
                        allProjects.slice(0, 6).map((project: Project, idx: number) => {
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
                              title={`${project.title}: $${budget.toLocaleString()}`}
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

            {/* My Projects */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-black uppercase tracking-tight flex items-center gap-3">
                  <span className="w-4 h-4 bg-black"></span>
                  My Projects
                </h2>
                <div className="h-1 flex-1 bg-black mx-4 opacity-20"></div>
                <div className="flex items-center gap-2">
                  {/* Create New Project Button */}
                  <button
                    onClick={() => setShowCreateProjectModal(true)}
                    className="px-4 py-2 border-2 font-bold uppercase text-xs tracking-wider transition-all flex items-center gap-2 text-white"
                    style={{
                      backgroundColor: colors.primary.pink,
                      borderColor: colors.primary.pink,
                      boxShadow: '0 4px 6px -1px rgba(242, 85, 110, 0.3), 0 2px 4px -1px rgba(242, 85, 110, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.primary.pinkDark;
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(224, 68, 93, 0.4), 0 2px 4px -1px rgba(224, 68, 93, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = colors.primary.pink;
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(242, 85, 110, 0.3), 0 2px 4px -1px rgba(242, 85, 110, 0.2)';
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Project
                  </button>
                  
                  {/* View Toggle */}
                  <div className="flex border-2 border-black bg-white">
                    <button
                      onClick={() => setViewMode('card')}
                      className={`px-3 py-1.5 text-xs font-bold uppercase transition-colors ${
                        viewMode === 'card'
                          ? 'bg-black text-white'
                          : 'bg-white text-black hover:bg-gray-100'
                      }`}
                      title="Card View"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-1.5 text-xs font-bold uppercase transition-colors border-l-2 border-black ${
                        viewMode === 'list'
                          ? 'bg-black text-white'
                          : 'bg-white text-black hover:bg-gray-100'
                      }`}
                      title="List View"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="mb-6 flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-black bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                  />
                </div>
                
                {/* Status Filter */}
                <div className="min-w-[150px]">
                  <FilterDropdown
                    options={[
                      { value: 'all', label: 'All Status' },
                      { value: 'active', label: 'Active' },
                      { value: 'draft', label: 'Draft' },
                      { value: 'archived', label: 'Archived' },
                    ]}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    placeholder="All Status"
                  />
                </div>

                {/* Type Filter */}
                <div className="min-w-[150px]">
                  <FilterDropdown
                    options={[
                      { value: 'all', label: 'All Types' },
                      ...Array.from(new Set(
                        allProjects
                          .map((p: Project) => p.project_type)
                          .filter(Boolean) as string[]
                      )).map((type) => ({
                        value: type.toLowerCase(),
                        label: type,
                      })),
                    ]}
                    value={typeFilter}
                    onChange={setTypeFilter}
                    placeholder="All Types"
                  />
                </div>

                {/* Clear Filters */}
                {(statusFilter !== 'all' || typeFilter !== 'all' || searchQuery.trim()) && (
                  <button
                    onClick={() => {
                      setStatusFilter('all');
                      setTypeFilter('all');
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 border-2 border-black bg-white font-mono text-sm uppercase hover:bg-gray-100 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              
              {projectsLoading || isFetching ? (
                <div className="flex items-center justify-center gap-3 border-2 border-black bg-white px-6 py-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="h-6 w-6 animate-spin border-4 border-black border-t-transparent rounded-full"></div>
                  <span className="font-mono text-sm uppercase font-bold">Retrieving Data...</span>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="border-2 border-dashed border-gray-400 bg-gray-50 px-6 py-12 text-center shadow-none">
                  <p className="font-mono text-sm text-gray-500 uppercase mb-4">
                    {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                      ? 'No projects match your filters.'
                      : 'No projects found. Create your first project!'}
                  </p>
                  <button 
                    onClick={() => setShowCreateProjectModal(true)}
                    className="px-6 py-3 bg-black text-white font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors"
                  >
                    Create New Project
                  </button>
                </div>
              ) : viewMode === 'card' ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {paginatedProjects.map((project) => (
                      <ProjectCard
                        key={project.id ?? project.title}
                        title={project.title || 'UNTITLED PROJECT'}
                        date={formatDate(project.updated_at || project.created_at)}
                        status={formatStatusLabel(project.status)}
                      />
                    ))}
                  </div>
                  <div className="mt-8">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={filteredProjects.length}
                      perPage={perPage}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                </>
              ) : (
                <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
                  {/* Column Headers */}
                  <div className="sticky top-0 z-10" style={{ backgroundColor: colors.primary.pink }}>
                    <div className="grid grid-cols-12 gap-4 px-6 py-2.5 items-center border-b-2 border-black">
                      {/* Checkbox Column */}
                      <div className="col-span-1 flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedProjects.size > 0 && selectedProjects.size === filteredProjects.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProjects(new Set(filteredProjects.map(p => (p.id ?? p.title ?? '') as string | number).filter(Boolean)));
                            } else {
                              setSelectedProjects(new Set());
                            }
                          }}
                          className="w-4 h-4 border-2 border-white rounded cursor-pointer focus:ring-2 focus:ring-white focus:ring-offset-1"
                          style={{ accentColor: 'white' }}
                        />
                      </div>
                      <div className="col-span-4">
                        <button
                          onClick={() => {
                            if (sortColumn === 'title') {
                              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortColumn('title');
                              setSortDirection('asc');
                            }
                          }}
                          className="text-sm font-semibold text-white hover:text-white transition-colors flex items-center gap-1.5 group"
                        >
                          <span>Project Title</span>
                          <div className="flex flex-col">
                            {sortColumn === 'title' ? (
                              sortDirection === 'asc' ? (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                                </svg>
                              ) : (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                </svg>
                              )
                            ) : (
                              <div className="flex flex-col opacity-40 group-hover:opacity-100 transition-opacity">
                                <svg className="w-3 h-3 -mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                                </svg>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </button>
                      </div>
                      <div className="col-span-2">
                        <button
                          onClick={() => {
                            if (sortColumn === 'type') {
                              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortColumn('type');
                              setSortDirection('asc');
                            }
                          }}
                          className="text-sm font-semibold text-white hover:text-white transition-colors flex items-center gap-1.5 group"
                        >
                          <span>Type</span>
                          <div className="flex flex-col">
                            {sortColumn === 'type' ? (
                              sortDirection === 'asc' ? (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                                </svg>
                              ) : (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                </svg>
                              )
                            ) : (
                              <div className="flex flex-col opacity-40 group-hover:opacity-100 transition-opacity">
                                <svg className="w-3 h-3 -mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                                </svg>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </button>
                      </div>
                      <div className="col-span-2">
                        <button
                          onClick={() => {
                            if (sortColumn === 'status') {
                              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortColumn('status');
                              setSortDirection('asc');
                            }
                          }}
                          className="text-sm font-semibold text-white hover:text-white transition-colors flex items-center gap-1.5 group"
                        >
                          <span>Status</span>
                          <div className="flex flex-col">
                            {sortColumn === 'status' ? (
                              sortDirection === 'asc' ? (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                                </svg>
                              ) : (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                </svg>
                              )
                            ) : (
                              <div className="flex flex-col opacity-40 group-hover:opacity-100 transition-opacity">
                                <svg className="w-3 h-3 -mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                                </svg>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </button>
                      </div>
                      <div className="col-span-2">
                        <button
                          onClick={() => {
                            if (sortColumn === 'updated') {
                              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortColumn('updated');
                              setSortDirection('asc');
                            }
                          }}
                          className="text-sm font-semibold text-white hover:text-white transition-colors flex items-center gap-1.5 group"
                        >
                          <span>Last Updated</span>
                          <div className="flex flex-col">
                            {sortColumn === 'updated' ? (
                              sortDirection === 'asc' ? (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                                </svg>
                              ) : (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                </svg>
                              )
                            ) : (
                              <div className="flex flex-col opacity-40 group-hover:opacity-100 transition-opacity">
                                <svg className="w-3 h-3 -mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                                </svg>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </button>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <span className="text-sm font-semibold text-white">Actions</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* List Items */}
                  <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                    {paginatedProjects.map((project) => (
                      <ProjectListItem
                        key={project.id ?? project.title}
                        projectId={(project.id ?? project.title ?? '') as string | number}
                        title={project.title || 'UNTITLED PROJECT'}
                        date={formatDate(project.updated_at || project.created_at)}
                        status={formatStatusLabel(project.status)}
                        projectType={project.project_type}
                        updatedAt={project.updated_at}
                        createdAt={project.created_at}
                        isSelected={selectedProjects.has((project.id ?? project.title ?? '') as string | number)}
                        onSelect={(id, selected) => {
                          const newSelected = new Set(selectedProjects);
                          if (selected) {
                            newSelected.add(id);
                          } else {
                            newSelected.delete(id);
                          }
                          setSelectedProjects(newSelected);
                        }}
                        onDelete={() => {
                          // TODO: Implement delete functionality
                          if (window.confirm(`Are you sure you want to delete "${project.title}"?`)) {
                            console.log('Delete project:', project.id);
                          }
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  <div className="border-t border-gray-300 bg-white px-6 py-4">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={filteredProjects.length}
                      perPage={perPage}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                  
                  {/* Bulk Actions Bar */}
                  {selectedProjects.size > 0 && (
                    <div className="border-t border-gray-300 bg-gray-50 px-6 py-3 flex items-center justify-between">
                      <span className="text-sm text-gray-700">
                        {selectedProjects.size} project{selectedProjects.size !== 1 ? 's' : ''} selected
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            // TODO: Implement bulk delete
                            if (window.confirm(`Delete ${selectedProjects.size} selected project(s)?`)) {
                              console.log('Bulk delete:', Array.from(selectedProjects));
                              setSelectedProjects(new Set());
                            }
                          }}
                          className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-300 rounded transition-colors"
                        >
                          Delete Selected
                        </button>
                        <button
                          onClick={() => setSelectedProjects(new Set())}
                          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded transition-colors"
                        >
                          Clear Selection
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;

