import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import LoadingScreen from "../components/LoadingScreen";

/**
 * Script Editor Page Component
 * Allows editing script scenes and content
 */
const ScriptEditorPage: React.FC = () => {
  const { scriptId, versionId } = useParams<{
    scriptId: string;
    versionId: string;
  }>();
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, loginWithRedirect } = useAuth0();
  const [activeTab, setActiveTab] = useState<"scenes" | "script" | "characters">("script");
  const [selectedScene, setSelectedScene] = useState<number>(1);

  // Handle authentication redirect
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect({
        appState: {
          returnTo: `/scripts/${scriptId}/versions/${versionId}`,
        },
      });
    }
  }, [isLoading, isAuthenticated, loginWithRedirect, scriptId, versionId]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Header Bar */}
      <div className="bg-[#1e3a5f] text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab("scenes")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
              activeTab === "scenes"
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:text-white hover:bg-blue-700"
            }`}
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Scenes
          </button>
          <button
            onClick={() => setActiveTab("script")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
              activeTab === "script"
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:text-white hover:bg-blue-700"
            }`}
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
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            Script
          </button>
          <button
            onClick={() => setActiveTab("characters")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
              activeTab === "characters"
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:text-white hover:bg-blue-700"
            }`}
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Characters
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-300">
            <div>Film & TV</div>
            <div className="flex items-center gap-1 mt-1">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Sep 8, 2024
            </div>
          </div>
          <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors">
            Help
          </button>
          <button
            onClick={() => navigate("/scripts")}
            className="text-gray-300 hover:text-white transition-colors p-1"
            title="Close"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Scene Navigation */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">Script</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Scene number
                </label>
                <input
                  type="text"
                  value="1205"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Name Filter
                </label>
                <input
                  type="text"
                  placeholder="Filter scenes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {/* Scene List */}
            <div className="p-2 space-y-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((num) => (
                <button
                  key={num}
                  onClick={() => setSelectedScene(num)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded text-left transition-colors ${
                    selectedScene === num
                      ? "bg-blue-100 text-blue-900"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm">
                    {num}. EXT. tropical island beach - day
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Central Panel - Script Content */}
        <div className="flex-1 bg-white flex flex-col overflow-hidden">
          {/* Scene Navigation Bar */}
          <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-3">
              <button className="p-1 hover:bg-gray-200 rounded">
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-medium">
                Scene {selectedScene}
              </button>
              <span className="text-sm text-gray-600">
                EXT. tropical island beach - day
              </span>
              <button className="p-1 hover:bg-gray-200 rounded">
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            </div>
            <button className="p-1 hover:bg-gray-200 rounded">
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
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            </button>
          </div>

          {/* Script Content Editor */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-4">
              {[
                { num: 1, text: "Int. Rochester Radisson 1 hotel room - dawn", collapsed: false },
                { num: 2, text: "", collapsed: true },
                { num: 3, text: "A window gives a perfect view of the far from perfect downtown", collapsed: false },
                { num: 4, text: "Rochester, NY.", collapsed: false },
                { num: 5, text: "", collapsed: true },
                { num: 6, text: "Barry emerges from the bathroom, removing earplugs. He pats his jacket,", collapsed: false },
                { num: 7, text: "he's missing something. He searches the floor......And as he does we begin", collapsed: false },
                { num: 8, text: "to see SOMETHING'S OFF: BULLET HOLES that have sent spiderwebs", collapsed: false },
                { num: 9, text: "up the window. Barry finds what he's looking for: a GLOCK with a", collapsed: false },
                { num: 10, text: "silencer. He racks the bolt, checks the chamber, unscrews the silencer and", collapsed: false },
                { num: 11, text: "stows both parts in his jacket...", collapsed: false },
                { num: 12, text: "", collapsed: true },
                { num: 13, text: "...A couple of more steps reveal a DEAD LAWYER IN HIS PAJAMAS", collapsed: false },
                { num: 14, text: "for the door.", collapsed: false },
                { num: 15, text: "", collapsed: true },
                { num: 16, text: 'Music: "You Are a Runner and I Am My Father\'s Son" by Wolf Parade.', collapsed: false },
                { num: 17, text: "", collapsed: true },
              ].map((line) => (
                <div
                  key={line.num}
                  className="flex items-start gap-3 group"
                >
                  <div className="flex items-center gap-2 min-w-[60px]">
                    <span className="text-sm text-gray-500 font-mono">
                      {line.num}
                    </span>
                    {line.collapsed && (
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="flex-1">
                    {line.text ? (
                      <p className="text-sm text-gray-900 leading-relaxed">
                        {line.text}
                      </p>
                    ) : (
                      <div className="h-4 border-b border-dashed border-gray-300"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Scene Metadata */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                {selectedScene} / 55 Scene
              </h3>
            </div>
            <div className="space-y-2">
              {[
                { name: "General information", color: "blue", count: null },
                { name: "Scene notes", color: "gray", count: null },
                { name: "Cast members", color: "purple", count: 2 },
                { name: "Props", color: "brown", count: 5 },
                { name: "Customes", color: "orange", count: 5 },
                { name: "Makeup", color: "pink", count: null },
                { name: "Vehicles", color: "teal", count: null },
                { name: "Stuns", color: "red", count: null },
                { name: "SPFX", color: "green", count: null },
                { name: "Music", color: "light-green", count: null },
              ].map((category) => (
                <button
                  key={category.name}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 transition-colors text-left"
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      category.color === "blue"
                        ? "bg-blue-500"
                        : category.color === "purple"
                        ? "bg-purple-500"
                        : category.color === "brown"
                        ? "bg-amber-700"
                        : category.color === "orange"
                        ? "bg-orange-500"
                        : category.color === "pink"
                        ? "bg-pink-500"
                        : category.color === "teal"
                        ? "bg-teal-500"
                        : category.color === "red"
                        ? "bg-red-500"
                        : category.color === "green"
                        ? "bg-green-500"
                        : "bg-gray-400"
                    }`}
                  ></div>
                  <span className="text-sm text-gray-700 flex-1">
                    {category.name}
                    {category.count !== null && (
                      <span className="text-gray-500 ml-1">
                        ({category.count})
                      </span>
                    )}
                  </span>
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-gray-100 border-t border-gray-200 px-6 py-3 flex items-center justify-end gap-3">
        <button className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">
          Finish later
        </button>
        <button className="px-4 py-2 text-white bg-gray-900 rounded hover:bg-gray-800 transition-colors">
          Back
        </button>
        <button className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors">
          Accept and proceed
        </button>
      </div>
    </div>
  );
};

export default ScriptEditorPage;

