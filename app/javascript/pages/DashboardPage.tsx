import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
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
  const [showCreateProjectModal, setShowCreateProjectModal] =
    React.useState(false);

  // View and filter state - MUST be before any early returns
  const [viewMode, setViewMode] = React.useState<"card" | "list">("list");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Sorting state
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">(
    "asc"
  );

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [perPage] = React.useState<number>(10); // Items per page

  // Bulk selection state
  const [selectedProjects, setSelectedProjects] = React.useState<
    Set<number | string>
  >(new Set());

  // Fetch all projects (we'll paginate client-side after filtering)
  const {
    data: projectsResponse,
    isLoading: projectsLoading,
    isFetching,
    error: projectsError,
  } = useProjectsQuery({
    page: 1,
    per_page: 1000, // Fetch all for client-side filtering
    enabled: isAuthenticated && currentUser?.onboarding_completed === true,
  });

  // Extract projects from response (handle both old array format and new paginated format)
  const allProjects: Project[] = React.useMemo(() => {
    if (!projectsResponse) return [];

    // Check if it's the new paginated format (has 'data' key)
    if (
      typeof projectsResponse === "object" &&
      "data" in projectsResponse &&
      Array.isArray((projectsResponse as any).data)
    ) {
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
      if (statusFilter !== "all" && project.status !== statusFilter) {
        return false;
      }

      // Type filter
      if (
        typeFilter !== "all" &&
        project.project_type?.toLowerCase() !== typeFilter.toLowerCase()
      ) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = project.title?.toLowerCase().includes(query);
        const matchesType = project.project_type?.toLowerCase().includes(query);
        const matchesDescription = project.description
          ?.toLowerCase()
          .includes(query);
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
          case "title":
            aValue = a.title?.toLowerCase() || "";
            bValue = b.title?.toLowerCase() || "";
            break;
          case "type":
            aValue = a.project_type?.toLowerCase() || "";
            bValue = b.project_type?.toLowerCase() || "";
            break;
          case "status":
            aValue = a.status?.toLowerCase() || "";
            bValue = b.status?.toLowerCase() || "";
            break;
          case "updated":
            aValue = new Date(a.updated_at || a.created_at || 0).getTime();
            bValue = new Date(b.updated_at || b.created_at || 0).getTime();
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [
    allProjects,
    statusFilter,
    typeFilter,
    searchQuery,
    sortColumn,
    sortDirection,
  ]);

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

  const activeCount = allProjects.filter(
    (project) => project.status === "active"
  ).length;
  const completedCount = allProjects.filter(
    (project) => project.status === "completed"
  ).length;
  const draftCount = allProjects.filter(
    (project) => project.status === "draft"
  ).length;
  const totalBudget = allProjects.reduce<number>(
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
        {/* Fixed Sidebar - Collapsible on hover */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar
            user={user ?? null}
            gender={currentUser?.gender}
            onLogout={handleLogout}
          />
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
                  value={
                    projectsLoading || isFetching
                      ? "..."
                      : activeCount.toString()
                  }
                  trend={
                    projectsLoading || isFetching
                      ? undefined
                      : `${
                          allProjects.length
                            ? Math.round(
                                (activeCount / allProjects.length) * 100
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
                          allProjects.length
                            ? Math.round(
                                (completedCount / allProjects.length) * 100
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
                          allProjects.length
                            ? Math.round(
                                (draftCount / allProjects.length) * 100
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
                      {allProjects.length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-mono uppercase text-gray-400">
                          No Data
                        </div>
                      ) : (
                        allProjects
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
                <div className="min-w-[150px]">
                  <FilterDropdown
                    options={[
                      { value: "all", label: "All Types" },
                      ...Array.from(
                        new Set(
                          allProjects
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
                    className="px-4 py-2 border-2 border-black bg-white font-mono text-sm uppercase hover:bg-gray-100 transition-colors"
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
              ) : filteredProjects.length === 0 ? (
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
                      totalItems={filteredProjects.length}
                      perPage={perPage}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                </>
              ) : (
                <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
                  {/* Column Headers */}
                  <div
                    className="sticky top-0 z-10"
                    style={{ backgroundColor: colors.primary.pink }}
                  >
                    <div className="grid grid-cols-12 gap-4 px-6 py-2.5 items-center border-b-2 border-black">
                      {/* Checkbox Column */}
                      <div className="col-span-1 flex items-center">
                        <input
                          type="checkbox"
                          checked={
                            selectedProjects.size > 0 &&
                            selectedProjects.size === filteredProjects.length
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProjects(
                                new Set(
                                  filteredProjects
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
                  <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
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
