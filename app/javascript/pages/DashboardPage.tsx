import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate, useLocation } from "react-router-dom";
import type { Project } from "../types/api";
import "../lib/openapi-config";
import { useProjectsQuery } from "../queries/projects/useProjectsQuery";
import { useCreateProjectMutation } from "../queries/projects/useCreateProjectMutation";
import { useCurrentUserQuery } from "../queries/users/useCurrentUserQuery";
import {
  useOnboardingMutation,
  type OnboardingData,
} from "../queries/users/useOnboardingMutation";
import LoadingScreen from "../components/LoadingScreen";
import OnboardingModal from "../components/OnboardingModal";
import CreateProjectModal from "../components/CreateProjectModal";
import FilterDropdown from "../components/FilterDropdown";
import Pagination from "../components/Pagination";
import Sidebar from "../components/dashboard/Sidebar";
import SidebarItem from "../components/dashboard/SidebarItem";
import Topbar from "../components/dashboard/Topbar";
import StatCard from "../components/dashboard/StatCard";
import ProjectCard from "../components/dashboard/ProjectCard";
import ProjectListItem from "../components/dashboard/ProjectListItem";
import { colors } from "../lib/theme";

/**
 * Dashboard Page Component
 */
const DashboardPage: React.FC = () => {
  const { user, isLoading, isAuthenticated, logout, loginWithRedirect } =
    useAuth0();
  const navigate = useNavigate();
  const location = useLocation();

  // Current user query to check onboarding status
  const {
    data: currentUser,
    isLoading: userLoading,
    error: userError,
  } = useCurrentUserQuery({
    enabled: isAuthenticated,
  });

  // Onboarding mutation
  const onboardingMutation = useOnboardingMutation();

  // Create project mutation
  const createProjectMutation = useCreateProjectMutation();
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // View and filter state - MUST be before any early returns
  const [viewMode, setViewMode] = useState<"card" | "list">("list");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [perPage] = useState<number>(10); // Items per page

  // Bulk selection state
  const [selectedProjects, setSelectedProjects] = useState<
    Set<number | string>
  >(new Set());

  // Build Ransack query parameters for server-side filtering
  const ransackQuery = useMemo(() => {
    const q: Record<string, any> = {};

    // Status filter
    if (statusFilter !== "all") {
      q.status_eq = statusFilter;
    }

    // Type filter
    if (typeFilter !== "all") {
      q.project_type_eq = typeFilter;
    }

    // Search query (search in title, project_type, and description)
    if (searchQuery.trim()) {
      q.title_or_project_type_or_description_cont = searchQuery.trim();
    }

    // Sorting
    if (sortColumn) {
      const sortKey = sortColumn === "updated" ? "updated_at" : sortColumn;
      q.s = `${sortKey} ${sortDirection}`;
    }

    return Object.keys(q).length > 0 ? q : undefined;
  }, [statusFilter, typeFilter, searchQuery, sortColumn, sortDirection]);

  // Fetch projects with server-side filtering and pagination
  const {
    data: projectsResponse,
    isLoading: projectsLoading,
    isFetching,
    error: projectsError,
  } = useProjectsQuery({
    q: ransackQuery,
    page: currentPage,
    per_page: perPage,
    enabled: isAuthenticated && currentUser?.onboarding_completed === true,
  });

  // Extract projects and pagination metadata from response
  const projects: Project[] = useMemo(() => {
    if (!projectsResponse) return [];
    if (
      typeof projectsResponse === "object" &&
      "data" in projectsResponse &&
      Array.isArray(projectsResponse.data)
    ) {
      return projectsResponse.data;
    }
    if (Array.isArray(projectsResponse)) {
      return projectsResponse;
    }
    return [];
  }, [projectsResponse]);

  const paginationMeta = useMemo(() => {
    if (
      projectsResponse &&
      typeof projectsResponse === "object" &&
      "pagination" in projectsResponse
    ) {
      return (projectsResponse as any).pagination;
    }

    return {
      page: currentPage,
      per_page: perPage,
      total: projects.length,
      total_pages: Math.ceil(projects.length / perPage) || 1,
      has_next: false,
      has_prev: false,
    };
  }, [projectsResponse, projects.length, currentPage, perPage]);

  const projectsErrorMessage = projectsError ? projectsError.message : null;

  // Use server-paginated projects directly
  const paginatedProjects = projects;
  const totalPages = paginationMeta.total_pages || 1;

  // Reset to page 1 when filters change (but not when page changes)
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, typeFilter, searchQuery, sortColumn, sortDirection]);

  // Automatically trigger login if not authenticated (e.g., coming from marketing page)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect({
        appState: {
          returnTo: "/dashboard",
        },
      }).catch((error) => {
        console.error("Login redirect failed:", error);
      });
    }
  }, [isLoading, isAuthenticated, loginWithRedirect]);

  // Check if onboarding is required
  const showOnboarding =
    isAuthenticated && currentUser && !currentUser.onboarding_completed;

  // Handle onboarding completion
  const handleOnboardingComplete = async (data: OnboardingData) => {
    await onboardingMutation.mutateAsync(data);
  };

  // Handle project creation
  const handleCreateProject = async (data: {
    title: string;
    project_type: string;
  }) => {
    try {
      await createProjectMutation.mutateAsync(data);
      setShowCreateProjectModal(false);
      // TODO: Navigate to project workspace or show success message
    } catch (error) {
      // Error is handled by the modal
      console.error("Failed to create project:", error);
    }
  };

  if (isLoading || !isAuthenticated || userLoading) {
    return <LoadingScreen />;
  }

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  // For stats, we need to fetch all projects (without filters) or use a separate stats endpoint
  // For now, we'll calculate from the current page data (not ideal, but works)
  // TODO: Consider adding a separate stats endpoint
  const activeCount = projects.filter(
    (project) => project.status === "active"
  ).length;
  const completedCount = projects.filter(
    (project) => (project.status as string) === "archived" || project.status === "completed"
  ).length;
  const draftCount = projects.filter(
    (project) => project.status === "draft"
  ).length;
  const totalBudget = projects.reduce<number>(
    (sum, project) => sum + (project.budget ?? 0),
    0
  );

  const formatStatusLabel = (
    status?: Project["status"]
  ): "Active" | "Completed" | "Draft" => {
    switch (status) {
      case "active":
        return "Active";
      case "completed":
        return "Completed";
      default:
        return "Draft";
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) {
      return "UNKNOWN";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date
      .toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      .toUpperCase();
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
          initialName={user?.name || currentUser?.name || ""}
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
      <div
        className={`min-h-screen bg-[#f5f1e8] flex ${
          showOnboarding ? "blur-sm pointer-events-none select-none" : ""
        }`}
      >
        {/* Fixed Sidebar - Collapsible on hover, hidden on mobile */}
        <Sidebar />

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Sidebar - Slide in from left */}
        <aside
          className={`fixed left-0 top-0 h-full w-64 bg-white border-r-2 border-black z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="h-full flex flex-col">
            <div className="border-b-2 border-black bg-gray-50 px-5 pt-6 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-black uppercase tracking-tighter">
                  Command Center
                </h2>
                <p className="text-xs font-mono text-gray-600 mt-1">
                  V.2.4.0-STABLE
                </p>
                </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-gray-200 rounded transition-colors"
                aria-label="Close menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col py-2 flex-1 overflow-y-auto">
              <div onClick={() => navigate("/dashboard")} className="cursor-pointer">
                <SidebarItem
                  label="Overview"
                  active={location.pathname === "/dashboard"}
                  alwaysShowLabel={true}
                  icon={
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                  }
                />
              </div>
              <div onClick={() => navigate("/scripts")} className="cursor-pointer">
                <SidebarItem
                  label="Script Database"
                  active={location.pathname === "/scripts"}
                  alwaysShowLabel={true}
                  icon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                    />
                  </svg>
                }
                />
              </div>
              <SidebarItem
                label="Production Log"
                alwaysShowLabel={true}
                icon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                }
              />
              <SidebarItem
                label="Assets & Props"
                alwaysShowLabel={true}
                icon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                }
              />
              <SidebarItem
                label="Cast & Crew"
                alwaysShowLabel={true}
                icon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                }
              />
              <SidebarItem
                label="Budget Control"
                alwaysShowLabel={true}
                icon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
              />
              <SidebarItem
                label="Approvals"
                alwaysShowLabel={true}
                icon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
              />
              <SidebarItem
                label="System Users"
                alwaysShowLabel={true}
                icon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                }
              />
              <SidebarItem
                label="Configuration"
                alwaysShowLabel={true}
                icon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                }
              />
                </nav>
            </div>
          </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar
            user={user ?? null}
            gender={currentUser?.gender}
            onLogout={handleLogout}
            onMenuClick={() => setIsMobileMenuOpen(true)}
          />
          <main className="flex-1 px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 overflow-y-auto">
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
              
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <StatCard 
                  title="Active Productions" 
                  value={
                    projectsLoading || isFetching
                      ? "..."
                      : activeCount.toString()
                  }
                  trend={
                    projectsLoading || isFetching
                      ? undefined
                      : `${
                          paginationMeta.total > 0
                            ? Math.round(
                                (activeCount / paginationMeta.total) * 100
                              )
                            : 0
                        }% RUNNING`
                  }
                  color="green"
                />
                <StatCard 
                  title="Archived / Done" 
                  value={
                    projectsLoading || isFetching
                      ? "..."
                      : completedCount.toString()
                  }
                  trend={
                    projectsLoading || isFetching
                      ? undefined
                      : `${
                          paginationMeta.total > 0
                            ? Math.round(
                                (completedCount / paginationMeta.total) * 100
                              )
                            : 0
                        }% COMPLETED`
                  }
                  color="blue"
                />
                <StatCard 
                  title="Draft Concepts" 
                  value={
                    projectsLoading || isFetching
                      ? "..."
                      : draftCount.toString()
                  }
                  subtitle={
                    projectsLoading || isFetching
                      ? undefined
                      : `${
                          paginationMeta.total > 0
                            ? Math.round(
                                (draftCount / paginationMeta.total) * 100
                              )
                            : 0
                        }%`
                  }
                  color="purple"
                />
                
                {/* Budget Card */}
                <div className="bg-white border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-200">
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Total Budget Allocation
                  </div>
                  <div className="text-2xl font-black text-black tracking-tighter mb-1">
                    {projectsLoading || isFetching
                      ? "..."
                      : `$${totalBudget.toLocaleString()}`}
                  </div>
                  <div className="text-[10px] font-mono text-gray-500 mb-4 uppercase">
                    {projectsLoading || isFetching
                      ? "SYNCING..."
                      : "AGGREGATED ACROSS ALL UNITS"}
                  </div>
                  
                  {/* Budget Visualization - Retro Bar */}
                  {projectsLoading || isFetching ? (
                    <div className="h-12 w-full bg-gray-100 animate-pulse border border-gray-200"></div>
                  ) : (
                    <div className="flex w-full h-12 border border-black bg-gray-50">
                      {projects.length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-mono uppercase text-gray-400">
                          No Data
                        </div>
                      ) : (
                        projects
                          .slice(0, 6)
                          .map((project: Project, idx: number) => {
                          const budget = project.budget ?? 0;
                            const widthPercent = Math.max(
                              5,
                              Math.round(
                                (budget / Math.max(totalBudget, 1)) * 100
                              )
                            );
                          // Cycle through retro patterns/colors
                            const patterns = [
                              "bg-black",
                              "bg-gray-400",
                              "bg-gray-800",
                              "bg-gray-200",
                            ];
                            const patternClass =
                              patterns[idx % patterns.length];
                          
                          return (
                            <div
                              key={project.id}
                              className={`h-full ${patternClass} border-r border-white last:border-r-0 relative group`}
                              style={{ width: `${widthPercent}%` }}
                                title={`${
                                  project.title
                                }: $${budget.toLocaleString()}`}
                              ></div>
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
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-0 mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl md:text-2xl font-black text-black uppercase tracking-tight flex items-center gap-2 sm:gap-3">
                  <span className="w-3 h-3 sm:w-4 sm:h-4 bg-black"></span>
                  My Projects
                </h2>
                <div className="h-1 flex-1 bg-black mx-2 sm:mx-4 opacity-20 hidden sm:block"></div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Create New Project Button */}
                  <button
                    onClick={() => setShowCreateProjectModal(true)}
                    className="px-4 py-2 border-2 font-bold uppercase text-xs tracking-wider transition-all flex items-center gap-2 text-white"
                    style={{
                      backgroundColor: colors.primary.pink,
                      borderColor: colors.primary.pink,
                      boxShadow:
                        "0 4px 6px -1px rgba(242, 85, 110, 0.3), 0 2px 4px -1px rgba(242, 85, 110, 0.2)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        colors.primary.pinkDark;
                      e.currentTarget.style.boxShadow =
                        "0 4px 6px -1px rgba(224, 68, 93, 0.4), 0 2px 4px -1px rgba(224, 68, 93, 0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        colors.primary.pink;
                      e.currentTarget.style.boxShadow =
                        "0 4px 6px -1px rgba(242, 85, 110, 0.3), 0 2px 4px -1px rgba(242, 85, 110, 0.2)";
                    }}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Create Project
                  </button>

                  {/* View Toggle */}
                  <div className="flex border-2 border-black bg-white">
                    <button
                      onClick={() => setViewMode("card")}
                      className={`px-3 py-1.5 text-xs font-bold uppercase transition-colors ${
                        viewMode === "card"
                          ? "bg-black text-white"
                          : "bg-white text-black hover:bg-gray-100"
                      }`}
                      title="Card View"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`px-3 py-1.5 text-xs font-bold uppercase transition-colors border-l-2 border-black ${
                        viewMode === "list"
                          ? "bg-black text-white"
                          : "bg-white text-black hover:bg-gray-100"
                      }`}
                      title="List View"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 12h16M4 18h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="mb-6 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
                {/* Search */}
                <div className="flex-1 w-full sm:min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-black bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                  />
                </div>

                {/* Status Filter */}
                <div className="w-full sm:w-auto sm:min-w-[150px]">
                  <FilterDropdown
                    options={[
                      { value: "all", label: "All Status" },
                      { value: "active", label: "Active" },
                      { value: "draft", label: "Draft" },
                      { value: "archived", label: "Archived" },
                    ]}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    placeholder="All Status"
                  />
                </div>

                {/* Type Filter */}
                <div className="w-full sm:w-auto sm:min-w-[150px]">
                  <FilterDropdown
                    options={[
                      { value: "all", label: "All Types" },
                      ...Array.from(
                        new Set(
                          projects
                            .map((p: Project) => p.project_type)
                            .filter(Boolean) as string[]
                        )
                      ).map((type) => ({
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
                {(statusFilter !== "all" ||
                  typeFilter !== "all" ||
                  searchQuery.trim()) && (
                  <button
                    onClick={() => {
                      setStatusFilter("all");
                      setTypeFilter("all");
                      setSearchQuery("");
                    }}
                    className="w-full sm:w-auto px-4 py-2 border-2 border-black bg-white font-mono text-sm uppercase hover:bg-gray-100 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              
              {projectsLoading || isFetching ? (
                <div className="flex items-center justify-center gap-3 border-2 border-black bg-white px-6 py-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="h-6 w-6 animate-spin border-4 border-black border-t-transparent rounded-full"></div>
                  <span className="font-mono text-sm uppercase font-bold">
                    Retrieving Data...
                  </span>
                </div>
              ) : projects.length === 0 ? (
                <div className="border-2 border-dashed border-gray-400 bg-gray-50 px-6 py-12 text-center shadow-none">
                  <p className="font-mono text-sm text-gray-500 uppercase mb-4">
                    {searchQuery ||
                    statusFilter !== "all" ||
                    typeFilter !== "all"
                      ? "No projects match your filters."
                      : "No projects found. Create your first project!"}
                  </p>
                  <button
                    onClick={() => setShowCreateProjectModal(true)}
                    className="px-6 py-3 bg-black text-white font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors"
                  >
                    Create New Project
                  </button>
                </div>
              ) : viewMode === "card" ? (
                <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {paginatedProjects.map((project) => (
                    <ProjectCard
                        key={project.id ?? project.title}
                        title={project.title || "UNTITLED PROJECT"}
                        date={formatDate(
                          project.updated_at || project.created_at
                        )}
                      status={formatStatusLabel(project.status)}
                    />
                  ))}
                  </div>
                  <div className="mt-8">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={paginationMeta.total}
                      perPage={perPage}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                </>
              ) : (
                <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
                  {/* Mobile: Scrollable table wrapper */}
                  <div className="overflow-x-auto">
                    {/* Column Headers */}
                    <div
                      className="sticky top-0 z-10 min-w-[800px]"
                      style={{ backgroundColor: colors.primary.pink }}
                    >
                      <div className="grid grid-cols-12 gap-2 sm:gap-4 px-3 sm:px-6 py-2 sm:py-2.5 items-center border-b-2 border-black">
                      {/* Checkbox Column */}
                      <div className="col-span-1 flex items-center">
                        <input
                          type="checkbox"
                          checked={
                            selectedProjects.size > 0 &&
                            selectedProjects.size === paginatedProjects.length
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProjects(
                                new Set(
                                  paginatedProjects
                                    .map(
                                      (p) =>
                                        (p.id ?? p.title ?? "") as
                                          | string
                                          | number
                                    )
                                    .filter(Boolean)
                                )
                              );
                            } else {
                              setSelectedProjects(new Set());
                            }
                          }}
                          className="w-4 h-4 border-2 border-white rounded cursor-pointer focus:ring-2 focus:ring-white focus:ring-offset-1"
                          style={{ accentColor: "white" }}
                        />
                      </div>
                      <div className="col-span-4">
                        <button
                          onClick={() => {
                            if (sortColumn === "title") {
                              setSortDirection(
                                sortDirection === "asc" ? "desc" : "asc"
                              );
                            } else {
                              setSortColumn("title");
                              setSortDirection("asc");
                            }
                          }}
                          className="text-sm font-semibold text-white hover:text-white transition-colors flex items-center gap-1.5 group"
                        >
                          <span>Project Title</span>
                          <div className="flex flex-col">
                            {sortColumn === "title" ? (
                              sortDirection === "asc" ? (
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 15l7-7 7 7"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              )
                            ) : (
                              <div className="flex flex-col opacity-40 group-hover:opacity-100 transition-opacity">
                                <svg
                                  className="w-3 h-3 -mb-0.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M5 15l7-7 7 7"
                                  />
                                </svg>
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                </div>
              )}
            </div>
                        </button>
        </div>
                      <div className="col-span-2">
                        <button
                          onClick={() => {
                            if (sortColumn === "type") {
                              setSortDirection(
                                sortDirection === "asc" ? "desc" : "asc"
                              );
                            } else {
                              setSortColumn("type");
                              setSortDirection("asc");
                            }
                          }}
                          className="text-sm font-semibold text-white hover:text-white transition-colors flex items-center gap-1.5 group"
                        >
                          <span>Type</span>
                          <div className="flex flex-col">
                            {sortColumn === "type" ? (
                              sortDirection === "asc" ? (
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 15l7-7 7 7"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              )
                            ) : (
                              <div className="flex flex-col opacity-40 group-hover:opacity-100 transition-opacity">
                                <svg
                                  className="w-3 h-3 -mb-0.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M5 15l7-7 7 7"
                                  />
                                </svg>
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
      </div>
                            )}
    </div>
                        </button>
                      </div>
                      <div className="col-span-2">
                        <button
                          onClick={() => {
                            if (sortColumn === "status") {
                              setSortDirection(
                                sortDirection === "asc" ? "desc" : "asc"
                              );
                            } else {
                              setSortColumn("status");
                              setSortDirection("asc");
                            }
                          }}
                          className="text-sm font-semibold text-white hover:text-white transition-colors flex items-center gap-1.5 group"
                        >
                          <span>Status</span>
                          <div className="flex flex-col">
                            {sortColumn === "status" ? (
                              sortDirection === "asc" ? (
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 15l7-7 7 7"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              )
                            ) : (
                              <div className="flex flex-col opacity-40 group-hover:opacity-100 transition-opacity">
                                <svg
                                  className="w-3 h-3 -mb-0.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M5 15l7-7 7 7"
                                  />
                                </svg>
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                        </button>
                      </div>
                      <div className="col-span-2">
                        <button
                          onClick={() => {
                            if (sortColumn === "updated") {
                              setSortDirection(
                                sortDirection === "asc" ? "desc" : "asc"
                              );
                            } else {
                              setSortColumn("updated");
                              setSortDirection("asc");
                            }
                          }}
                          className="text-sm font-semibold text-white hover:text-white transition-colors flex items-center gap-1.5 group"
                        >
                          <span>Last Updated</span>
                          <div className="flex flex-col">
                            {sortColumn === "updated" ? (
                              sortDirection === "asc" ? (
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 15l7-7 7 7"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              )
                            ) : (
                              <div className="flex flex-col opacity-40 group-hover:opacity-100 transition-opacity">
                                <svg
                                  className="w-3 h-3 -mb-0.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M5 15l7-7 7 7"
                                  />
                                </svg>
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                        </button>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <span className="text-sm font-semibold text-white">
                          Actions
                        </span>
                      </div>
                      </div>
                    </div>

                    {/* List Items */}
                    <div className="divide-y divide-gray-200 max-h-[400px] sm:max-h-[600px] overflow-y-auto min-w-[800px]">
                      {paginatedProjects.map((project) => (
                        <ProjectListItem
                          key={project.id ?? project.title}
                          projectId={
                            (project.id ?? project.title ?? "") as string | number
                          }
                          title={project.title || "UNTITLED PROJECT"}
                          date={formatDate(
                            project.updated_at || project.created_at
                          )}
                      status={formatStatusLabel(project.status)}
                          projectType={project.project_type}
                          updatedAt={project.updated_at}
                          createdAt={project.created_at}
                          isSelected={selectedProjects.has(
                            (project.id ?? project.title ?? "") as string | number
                          )}
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
                            if (
                              window.confirm(
                                `Are you sure you want to delete "${project.title}"?`
                              )
                            ) {
                              console.log("Delete project:", project.id);
                            }
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Pagination */}
                  <div className="border-t border-gray-300 bg-white px-3 sm:px-6 py-3 sm:py-4">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={paginationMeta.total}
                      perPage={perPage}
                      onPageChange={setCurrentPage}
                    />
                  </div>

                  {/* Bulk Actions Bar */}
                  {selectedProjects.size > 0 && (
                    <div className="border-t border-gray-300 bg-gray-50 px-6 py-3 flex items-center justify-between">
                      <span className="text-sm text-gray-700">
                        {selectedProjects.size} project
                        {selectedProjects.size !== 1 ? "s" : ""} selected
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            // TODO: Implement bulk delete
                            if (
                              window.confirm(
                                `Delete ${selectedProjects.size} selected project(s)?`
                              )
                            ) {
                              console.log(
                                "Bulk delete:",
                                Array.from(selectedProjects)
                              );
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
