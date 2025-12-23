import React from "react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  color?: "blue" | "green" | "orange" | "purple";
  trend?: string;
}

/**
 * Stat Card Component
 */
const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  color = "blue",
  trend,
}) => {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-100",
    green: "bg-green-100",
    orange: "bg-orange-100",
    purple: "bg-purple-100",
  };

  const accentColors: Record<string, string> = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    orange: "bg-orange-500",
    purple: "bg-purple-500",
  };

  return (
    <div className="group relative bg-white border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-200">
      <div
        className={`absolute top-4 right-4 w-3 h-3 ${accentColors[color]} border border-black`}
      ></div>
      <div className="relative z-10">
        <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
          {title}
        </div>
        <div className="text-4xl font-black text-black tracking-tighter">
          {value}
        </div>
        {subtitle && (
          <div className="mt-2 text-xs font-mono text-gray-600 border-t border-gray-200 pt-2 inline-block">
            {subtitle}
          </div>
        )}
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

export default StatCard;

