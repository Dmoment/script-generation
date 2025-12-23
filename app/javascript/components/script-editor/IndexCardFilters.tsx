import React from "react";
import FilterDropdown from "../FilterDropdown";

interface IndexCardFiltersProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  filters: {
    act: string | null;
    location: string | null;
    character: string | null;
    tone: string | null;
    status: string | null;
  };
  onFilterChange: (filterType: string, value: string | null) => void;
  availableActs: string[];
  availableLocations: string[];
  availableCharacters: string[];
  availableTones: string[];
  availableStatuses: string[];
}

const IndexCardFilters: React.FC<IndexCardFiltersProps> = ({
  isCollapsed,
  onToggleCollapse,
  filters,
  onFilterChange,
  availableActs,
  availableLocations,
  availableCharacters,
  availableTones,
  availableStatuses,
}) => {
  if (isCollapsed) {
    return (
      <div className="w-12 bg-white border-r-2 border-black flex flex-col items-center py-4 shadow-[2px_0_0_0_rgba(0,0,0,1)] transition-all duration-200">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Expand filters"
        >
          <svg
            className="w-5 h-5 text-black"
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
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-r-2 border-black flex flex-col shadow-[2px_0_0_0_rgba(0,0,0,1)] transition-all duration-200">
      <div className="p-4 border-b-2 border-black flex items-center justify-between">
        <h2 className="text-lg font-black uppercase text-black tracking-tight">
          Filters
        </h2>
        <button
          onClick={onToggleCollapse}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Collapse filters"
        >
          <svg
            className="w-4 h-4 text-black"
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase text-black mb-2 font-mono">
            Act
          </label>
          <FilterDropdown
            options={availableActs}
            selectedValue={filters.act}
            placeholder="All Acts"
            onSelect={(value) => onFilterChange("act", value)}
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-black mb-2 font-mono">
            Location
          </label>
          <FilterDropdown
            options={availableLocations}
            selectedValue={filters.location}
            placeholder="All Locations"
            onSelect={(value) => onFilterChange("location", value)}
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-black mb-2 font-mono">
            Character
          </label>
          <FilterDropdown
            options={availableCharacters}
            selectedValue={filters.character}
            placeholder="All Characters"
            onSelect={(value) => onFilterChange("character", value)}
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-black mb-2 font-mono">
            Tone
          </label>
          <FilterDropdown
            options={availableTones}
            selectedValue={filters.tone}
            placeholder="All Tones"
            onSelect={(value) => onFilterChange("tone", value)}
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-black mb-2 font-mono">
            Status
          </label>
          <FilterDropdown
            options={availableStatuses}
            selectedValue={filters.status}
            placeholder="All Statuses"
            onSelect={(value) => onFilterChange("status", value)}
          />
        </div>
      </div>
    </div>
  );
};

export default IndexCardFilters;
