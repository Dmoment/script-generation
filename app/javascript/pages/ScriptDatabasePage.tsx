import React, { useState, useMemo, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate, useLocation } from "react-router-dom";
import type { Script, Project, ScriptVersion } from "../types/api";
import "../lib/openapi-config";
import { useProjectsQuery } from "../queries/projects/useProjectsQuery";
import { useCurrentUserQuery } from "../queries/users/useCurrentUserQuery";
import { useScriptsQuery } from "../queries/scripts/useScriptsQuery";
import { useCreateScriptMutation } from "../queries/scripts/useCreateScriptMutation";
import { useUploadScriptMutation } from "../queries/scripts/useUploadScriptMutation";
import { useDeleteScriptMutation } from "../queries/scripts/useDeleteScriptMutation";
import { useDeleteScriptVersionMutation } from "../queries/scripts/useDeleteScriptVersionMutation";
import LoadingScreen from "../components/LoadingScreen";
import CreateScriptModal from "../components/CreateScriptModal";
import FilterDropdown from "../components/FilterDropdown";
import Pagination from "../components/Pagination";
import Sidebar from "../components/dashboard/Sidebar";
import SidebarItem from "../components/dashboard/SidebarItem";
import Topbar from "../components/dashboard/Topbar";
import ScriptCard from "../components/dashboard/ScriptCard";
import ThreadConnector from "../components/ThreadConnector";
import { colors, getStatusStyles, getVersionBadgeColor } from "../lib/theme";

/**
 * Script Database Page Component
 */
const ScriptDatabasePage: React.FC = () => {
  const { user, isLoading, isAuthenticated, logout, loginWithRedirect } =
    useAuth0();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Current user query to check onboarding status
  const {
    data: currentUser,
    isLoading: userLoading,
    error: userError,
  } = useCurrentUserQuery({
    enabled: isAuthenticated,
  });

  // Fetch projects for project selection
  const {
    data: projectsResponse,
    isLoading: projectsLoading,
    error: projectsError,
  } = useProjectsQuery({
    page: 1,
    per_page: 100,
    enabled: isAuthenticated && currentUser?.onboarding_completed === true,
  });

  // Extract projects from response
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

  // Script creation mutations
  const createScriptMutation = useCreateScriptMutation();
  const uploadScriptMutation = useUploadScriptMutation();
  const deleteScriptMutation = useDeleteScriptMutation();
  const deleteScriptVersionMutation = useDeleteScriptVersionMutation();
  const [showCreateScriptModal, setShowCreateScriptModal] = useState(false);

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "script" | "version";
    id: number;
    name: string;
    isVersion1?: boolean;
  } | null>(null);

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

  // UI state
  const [expandedScripts, setExpandedScripts] = useState<Set<number>>(
    new Set()
  );
  const [selectedScripts, setSelectedScripts] = useState<Set<number>>(
    new Set()
  );

  // Helper functions are now imported from theme.ts

  // Build Ransack query parameters for server-side filtering
  const ransackQuery = useMemo(() => {
    const q: Record<string, any> = {};

    // Status filter
    if (statusFilter !== "all") {
      q.status_eq = statusFilter;
    }

    // Type filter
    if (typeFilter !== "all") {
      q.script_type_eq = typeFilter;
    }

    // Search query (search in title and description)
    if (searchQuery.trim()) {
      q.title_or_description_cont = searchQuery.trim();
    }

    // Sorting
    if (sortColumn) {
      const sortKey = sortColumn === "updated" ? "updated_at" : sortColumn;
      q.s = `${sortKey} ${sortDirection}`;
    }

    return Object.keys(q).length > 0 ? q : undefined;
  }, [statusFilter, typeFilter, searchQuery, sortColumn, sortDirection]);

  // Fetch scripts with server-side filtering and pagination
  const {
    data: scriptsResponse,
    isLoading: scriptsLoading,
    error: scriptsError,
  } = useScriptsQuery({
    q: ransackQuery,
    page: currentPage,
    per_page: perPage,
    enabled:
      isAuthenticated &&
      currentUser?.onboarding_completed === true &&
      projects.length > 0,
  });

  // Extract scripts from response
  const scripts: Script[] = useMemo(() => {
    if (!scriptsResponse) return [];
    if (
      typeof scriptsResponse === "object" &&
      "data" in scriptsResponse &&
      Array.isArray(scriptsResponse.data)
    ) {
      return scriptsResponse.data;
    }
    if (Array.isArray(scriptsResponse)) {
      return scriptsResponse;
    }
    return [];
  }, [scriptsResponse]);

  const paginationMeta = useMemo(() => {
    if (
      scriptsResponse &&
      typeof scriptsResponse === "object" &&
      "pagination" in scriptsResponse
    ) {
      return (scriptsResponse as any).pagination;
    }

    return {
      page: currentPage,
      per_page: perPage,
      total: scripts.length,
      total_pages: Math.ceil(scripts.length / perPage) || 1,
      has_next: false,
      has_prev: false,
    };
  }, [scriptsResponse, scripts.length, currentPage, perPage]);

  const scriptsErrorMessage = scriptsError ? scriptsError.message : null;

  // Use server-paginated scripts directly
  const paginatedScripts = scripts;
  const totalPages = paginationMeta.total_pages || 1;

  // Reset to page 1 when filters change (but not when page changes)
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, typeFilter, searchQuery, sortColumn, sortDirection]);

  // Group scripts by project
  const scriptsByProject = useMemo(() => {
    const grouped: Record<
      number | string,
      { project: Project; scripts: Script[] }
    > = {};
    scripts.forEach((script) => {
      const project = projects.find((p) => p.id === script.project_id);
      if (project && project.id !== undefined) {
        const projectId = String(project.id);
        if (!grouped[projectId]) {
          grouped[projectId] = { project, scripts: [] };
        }
        grouped[projectId].scripts.push(script);
      }
    });
    return grouped;
  }, [scripts, projects]);

  const toggleScriptExpand = (scriptId: number) => {
    setExpandedScripts((prev) => {
      const next = new Set(prev);
      if (next.has(scriptId)) {
        next.delete(scriptId);
      } else {
        next.add(scriptId);
      }
      return next;
    });
  };

  // Handle authentication redirect
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect({
        appState: {
          returnTo: "/scripts",
        },
      }).catch((error) => {
        console.error("Login redirect failed:", error);
      });
    }
  }, [isLoading, isAuthenticated, loginWithRedirect]);

  // Show loading screen
  if (isLoading || userLoading || projectsLoading || scriptsLoading) {
    return <LoadingScreen />;
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Redirect if onboarding not completed
  if (currentUser && !currentUser.onboarding_completed) {
    navigate("/dashboard");
    return null;
  }

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const handleCreateScript = async (data: {
    project_id: number | string;
    title: string;
  }) => {
    await createScriptMutation.mutateAsync({
      ...data,
      script_type: "screenplay", // Default script type
    });
    setShowCreateScriptModal(false);
  };

  const handleUploadScript = async (data: {
    project_id: number | string;
    title: string;
    file: File;
    notes?: string;
  }) => {
    await uploadScriptMutation.mutateAsync({
      ...data,
      script_type: "screenplay", // Default script type
    });
    setShowCreateScriptModal(false);
  };

  const handleDeleteScript = async (scriptId: number) => {
    try {
      await deleteScriptMutation.mutateAsync(scriptId);
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete script:", error);
    }
  };

  const handleDeleteVersion = async (versionId: number) => {
    try {
      await deleteScriptVersionMutation.mutateAsync(versionId);
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete version:", error);
    }
  };

  const handleOpenCreateModal = () => {
    if (projects.length === 0) {
      alert("Please create a project first before creating scripts.");
      navigate("/dashboard");
      return;
    }
    setShowCreateScriptModal(true);
  };

  return (
    <>
      {showCreateScriptModal && (
        <CreateScriptModal
          projects={projects}
          onClose={() => setShowCreateScriptModal(false)}
          onCreate={handleCreateScript}
          onUpload={handleUploadScript}
          isSubmitting={
            createScriptMutation.isPending || uploadScriptMutation.isPending
          }
          error={
            createScriptMutation.error?.message ||
            uploadScriptMutation.error?.message ||
            null
          }
        />
      )}

      {/* Dashboard Content */}
      <div className="min-h-screen bg-[#f5f1e8] flex">
        {/* Fixed Sidebar */}
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
              <div
                onClick={() => {
                  navigate("/dashboard");
                  setIsMobileMenuOpen(false);
                }}
                className="cursor-pointer"
              >
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
              <div
                onClick={() => {
                  navigate("/scripts");
                  setIsMobileMenuOpen(false);
                }}
                className="cursor-pointer"
              >
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
            {/* Scripts Section */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-black uppercase tracking-tight flex items-center gap-3">
                  <span className="w-4 h-4 bg-black"></span>
                  Scripts
                </h2>
                <div className="h-1 flex-1 bg-black mx-4 opacity-20"></div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Create Script Button */}
                  <button
                    onClick={handleOpenCreateModal}
                    className="px-4 py-2 border-2 border-black font-bold uppercase tracking-wider text-white transition-colors flex items-center gap-2"
                    style={{
                      backgroundColor: colors.primary.pink,
                      borderColor: colors.primary.pink,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        colors.primary.pinkDark;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        colors.primary.pink;
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
                    Create Script
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

              {scriptsErrorMessage && (
                <div className="mb-6 border-2 border-red-500 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 uppercase tracking-wide">
                  Error: {scriptsErrorMessage}
                </div>
              )}

              {/* Filters */}
              <div className="mb-6 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
                {/* Search */}
                <div className="flex-1 w-full sm:min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Search scripts..."
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
                      { value: "locked", label: "Locked" },
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
                      { value: "screenplay", label: "Screenplay" },
                      { value: "treatment", label: "Treatment" },
                      { value: "outline", label: "Outline" },
                      { value: "other", label: "Other" },
                    ]}
                    value={typeFilter}
                    onChange={setTypeFilter}
                    placeholder="All Types"
                  />
                </div>
              </div>

              {/* Scripts Display */}
              {scriptsLoading ? (
                <div className="flex items-center justify-center gap-3 border-2 border-black bg-white px-6 py-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="h-6 w-6 animate-spin border-4 border-black border-t-transparent rounded-full"></div>
                  <span className="font-mono text-sm uppercase font-bold">
                    Retrieving Data...
                  </span>
                </div>
              ) : paginatedScripts.length === 0 ? (
                <div className="border-2 border-dashed border-gray-400 bg-gray-50 px-6 py-12 text-center shadow-none">
                  <p className="font-mono text-sm text-gray-500 uppercase mb-4">
                    {searchQuery ||
                    statusFilter !== "all" ||
                    typeFilter !== "all"
                      ? "No scripts match your filters."
                      : "No scripts found. Create your first script!"}
                  </p>
                  <button
                    onClick={handleOpenCreateModal}
                    className="px-6 py-3 bg-black text-white font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors"
                  >
                    Create New Script
                  </button>
                </div>
              ) : viewMode === "card" ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {paginatedScripts.map((script) => {
                      const project = projects.find(
                        (p) => p.id === script.project_id
                      );
                      const versions = (
                        (script as any).script_versions || []
                      ).sort(
                        (a: any, b: any) =>
                          (a.version_number || 0) - (b.version_number || 0)
                      );
                      return (
                        <ScriptCard
                          key={script.id}
                          script={script}
                          projectTitle={project?.title}
                          versions={versions}
                        />
                      );
                    })}
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
                <>
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
                                paginatedScripts.length > 0 &&
                                selectedScripts.size === paginatedScripts.length
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedScripts(
                                    new Set(paginatedScripts.map((s) => s.id))
                                  );
                                } else {
                                  setSelectedScripts(new Set());
                                }
                              }}
                              className="w-4 h-4 border-2 border-white rounded cursor-pointer focus:ring-2 focus:ring-white focus:ring-offset-1"
                              style={{ accentColor: "white" }}
                            />
                          </div>
                          {/* Title Column */}
                          <div className="col-span-4">
                            <span className="text-sm font-semibold text-white">
                              Script Title
                            </span>
                          </div>
                          {/* Project Column */}
                          <div className="col-span-2">
                            <span className="text-sm font-semibold text-white">
                              Project
                            </span>
                          </div>
                          {/* Type Column */}
                          <div className="col-span-2">
                            <span className="text-sm font-semibold text-white">
                              Type
                            </span>
                          </div>
                          {/* Status Column */}
                          <div className="col-span-2">
                            <span className="text-sm font-semibold text-white">
                              Status
                            </span>
                          </div>
                          {/* Actions Column */}
                          <div className="col-span-1"></div>
                        </div>
                      </div>

                      {/* Table Body */}
                      <div className="divide-y divide-gray-200">
                        {paginatedScripts.map((script) => {
                          const project = projects.find(
                            (p) => p.id === script.project_id
                          );
                          const isSelected = selectedScripts.has(script.id);
                          const isExpanded = expandedScripts.has(script.id);
                          const versions = (
                            (script as any).script_versions || []
                          ).sort(
                            (a: any, b: any) =>
                              (a.version_number || 0) - (b.version_number || 0)
                          );
                          const statusStyles = getStatusStyles(script.status);
                          const formattedDate = new Date(
                            script.created_at
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          });

                          return (
                            <React.Fragment key={script.id}>
                              <div
                                className={`group bg-white hover:bg-gray-50 transition-colors duration-150 ${
                                  isSelected ? "bg-pink-50" : ""
                                } ${isExpanded ? "bg-blue-50" : ""}`}
                              >
                                <div className="grid grid-cols-12 gap-2 sm:gap-4 px-3 sm:px-6 py-2 sm:py-2.5 items-center min-w-[800px]">
                                  {/* Checkbox and Expand Arrow */}
                                  <div
                                    className="col-span-1 flex items-center gap-2"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        const newSelected = new Set(
                                          selectedScripts
                                        );
                                        if (e.target.checked) {
                                          newSelected.add(script.id);
                                        } else {
                                          newSelected.delete(script.id);
                                        }
                                        setSelectedScripts(newSelected);
                                      }}
                                      className="w-4 h-4 border-2 border-gray-300 rounded cursor-pointer focus:ring-2 focus:ring-pink-500 focus:ring-offset-1"
                                      style={{
                                        accentColor: colors.primary.pink,
                                      }}
                                    />
                                    {versions.length > 0 && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleScriptExpand(script.id);
                                        }}
                                        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all hover:opacity-80 border-2"
                                        style={{
                                          borderColor: colors.primary.pink,
                                        }}
                                        title={
                                          isExpanded
                                            ? "Collapse versions"
                                            : `Expand ${
                                                versions.length
                                              } version${
                                                versions.length !== 1 ? "s" : ""
                                              }`
                                        }
                                      >
                                        <svg
                                          className={`w-2.5 h-2.5 transition-transform ${
                                            isExpanded ? "rotate-90" : ""
                                          }`}
                                          fill="none"
                                          stroke={colors.primary.pink}
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2.5}
                                            d="M9 5l7 7-7 7"
                                          />
                                        </svg>
                                      </button>
                                    )}
                                  </div>

                                  {/* Title */}
                                  <div className="col-span-4 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-sm text-gray-900 group-hover:text-black truncate">
                                          {script.title}
                                        </h3>
                                        {script.latest_version_number > 0 && (
                                          <div className="flex items-center gap-2 mt-1">
                                            <span
                                              className="text-xs font-bold uppercase px-2 py-0.5 rounded border"
                                              style={{
                                                backgroundColor:
                                                  getVersionBadgeColor(
                                                    script.latest_version_number
                                                  ).bg,
                                                color: getVersionBadgeColor(
                                                  script.latest_version_number
                                                ).text,
                                                borderColor:
                                                  getVersionBadgeColor(
                                                    script.latest_version_number
                                                  ).text,
                                              }}
                                            >
                                              v{script.latest_version_number}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Project */}
                                  <div className="col-span-2">
                                    <span className="text-sm text-gray-600 truncate block">
                                      {project?.title || "—"}
                                    </span>
                                  </div>

                                  {/* Type */}
                                  <div className="col-span-2">
                                    <span className="text-sm text-gray-600 uppercase">
                                      {script.script_type}
                                    </span>
                                  </div>

                                  {/* Status */}
                                  <div className="col-span-2">
                                    <span
                                      className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded border"
                                      style={{
                                        backgroundColor: statusStyles.bg,
                                        color: statusStyles.text,
                                        borderColor: statusStyles.border,
                                        minWidth: "80px",
                                      }}
                                    >
                                      {script.status.charAt(0).toUpperCase() +
                                        script.status.slice(1)}
                                    </span>
                                  </div>

                                  {/* Actions */}
                                  <div className="col-span-1 flex justify-end gap-2 items-center">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Use the actual version ID, not version number
                                        const latestVersion =
                                          versions.length > 0
                                            ? versions[versions.length - 1]
                                            : null;
                                        if (latestVersion) {
                                          navigate(
                                            `/scripts/${script.id}/versions/${latestVersion.id}`
                                          );
                                        }
                                      }}
                                      className="text-xs font-medium text-gray-700 hover:text-black transition-colors px-2 py-1"
                                    >
                                      Open →
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteConfirm({
                                          type: "script",
                                          id: script.id,
                                          name: script.title,
                                        });
                                      }}
                                      className="text-red-600 hover:text-red-800 transition-colors p-1.5 rounded hover:bg-red-50"
                                      title="Delete script"
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
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Expanded Versions */}
                              {isExpanded &&
                                versions.length > 0 &&
                                versions.map((version: any) => {
                                  const versionBadgeColor =
                                    getVersionBadgeColor(
                                      version.version_number
                                    );
                                  const versionDate = new Date(
                                    version.created_at
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  });
                                  const isActive =
                                    version.version_number ===
                                    script.latest_version_number;

                                  const versionIndex = versions.findIndex(
                                    (v: any) => v.id === version.id
                                  );
                                  const isLastVersion =
                                    versionIndex === versions.length - 1;

                                  return (
                                    <div
                                      key={version.id}
                                      className="bg-gray-50 border-b border-gray-200 relative"
                                      style={{ minHeight: "48px" }}
                                    >
                                      {/* Thread connector - reusable component */}
                                      <ThreadConnector
                                        isLast={isLastVersion}
                                        color={colors.primary.pink}
                                        width="180px"
                                        rowHeight={48}
                                        verticalLineX={24}
                                        curveY={24}
                                        horizontalEndX={120}
                                      />

                                      <div className="grid grid-cols-12 gap-2 sm:gap-4 px-3 sm:px-6 py-2 items-center min-w-[800px] relative z-10">
                                        <div className="col-span-1 flex items-center relative">
                                          {/* Spacer for thread */}
                                        </div>
                                        <div className="col-span-4 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span
                                              className="text-xs font-bold uppercase px-2 py-0.5 rounded border"
                                              style={{
                                                backgroundColor:
                                                  versionBadgeColor.bg,
                                                color: versionBadgeColor.text,
                                                borderColor:
                                                  versionBadgeColor.text,
                                              }}
                                            >
                                              v{version.version_number}
                                            </span>
                                            {Boolean(
                                              version.has_uploaded_file
                                            ) && (
                                              <span
                                                className="inline-flex items-center gap-1 text-xs text-gray-600 bg-blue-50 px-1.5 py-0.5 rounded"
                                                title="Uploaded file"
                                              >
                                                <svg
                                                  className="w-3.5 h-3.5 text-blue-600"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  viewBox="0 0 24 24"
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                                  />
                                                </svg>
                                                <span className="text-xs text-blue-600 font-medium">
                                                  Uploaded
                                                </span>
                                              </span>
                                            )}
                                            <span className="text-sm text-gray-700 truncate">
                                              {script.title} -{" "}
                                              {version.notes ||
                                                `script ${versionDate}`}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="col-span-2">
                                          <span className="text-sm text-gray-500">
                                            {versionDate}
                                          </span>
                                        </div>
                                        <div className="col-span-2">
                                          <span className="text-sm text-gray-600">
                                            —
                                          </span>
                                        </div>
                                        <div className="col-span-2">
                                          <span
                                            className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded border"
                                            style={{
                                              backgroundColor: isActive
                                                ? statusStyles.bg
                                                : "#F9FAFB",
                                              color: isActive
                                                ? statusStyles.text
                                                : "#6B7280",
                                              borderColor: isActive
                                                ? statusStyles.border
                                                : "#D1D5DB",
                                              minWidth: "80px",
                                            }}
                                          >
                                            {isActive ? "Active" : "Inactive"}
                                          </span>
                                        </div>
                                        {/* Actions - Open link at version level */}
                                        <div className="col-span-1 flex justify-end gap-2 items-center">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              navigate(
                                                `/scripts/${script.id}/versions/${version.id}`
                                              );
                                            }}
                                            className="text-xs font-medium text-gray-700 hover:text-black transition-colors px-2 py-1"
                                          >
                                            Open →
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setDeleteConfirm({
                                                type: "version",
                                                id: version.id,
                                                name: `Version ${version.version_number}`,
                                                isVersion1:
                                                  version.version_number === 1,
                                              });
                                            }}
                                            className="text-red-600 hover:text-red-800 transition-colors p-1.5 rounded hover:bg-red-50"
                                            title="Delete version"
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
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                              />
                                            </svg>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                            </React.Fragment>
                          );
                        })}
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
                  </div>
                </>
              )}
            </div>

            {/* Empty States */}
            {projects.length === 0 && (
              <div className="border-2 border-dashed border-gray-400 bg-gray-50 px-6 py-12 text-center">
                <p className="font-mono text-sm text-gray-500 uppercase mb-4">
                  No projects found. Create a project first!
                </p>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="px-6 py-3 bg-black text-white font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirm Delete
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-medium">{deleteConfirm.name}</span>?
              {deleteConfirm.type === "script" && (
                <span className="block mt-2 text-red-600">
                  This will also delete all versions of this script.
                </span>
              )}
              {deleteConfirm.type === "version" && deleteConfirm.isVersion1 && (
                <span className="block mt-2 text-red-600">
                  Deleting version 1 will delete the entire script and all its
                  versions.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === "script") {
                    handleDeleteScript(deleteConfirm.id);
                  } else {
                    handleDeleteVersion(deleteConfirm.id);
                  }
                }}
                disabled={
                  deleteScriptMutation.isPending ||
                  deleteScriptVersionMutation.isPending
                }
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteScriptMutation.isPending ||
                deleteScriptVersionMutation.isPending
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ScriptDatabasePage;
