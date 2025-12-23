import React from "react";

interface ProjectCardProps {
  title: string;
  date: string;
  status?: "Active" | "Completed" | "Draft";
}

/**
 * Project Card Component
 */
const ProjectCard: React.FC<ProjectCardProps> = ({
  title,
  date,
  status = "Active",
}) => {
  const statusStyles: Record<string, string> = {
    Active: "bg-green-500 text-white border-green-600",
    Completed: "bg-blue-500 text-white border-blue-600",
    Draft: "bg-gray-200 text-gray-800 border-gray-300",
  };

  return (
    <div className="group relative bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg text-black group-hover:underline decoration-2 underline-offset-2">
            {title}
          </h3>
          <p className="text-xs font-mono text-gray-500 mt-1 uppercase">
            {date}
          </p>
        </div>
        <div
          className={`w-3 h-3 ${
            status === "Active"
              ? "bg-green-500"
              : status === "Completed"
              ? "bg-blue-500"
              : "bg-gray-400"
          } border border-black`}
        ></div>
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

export default ProjectCard;

