import React from "react";

interface EditableSluglineProps {
  slugline: string;
  placeholder?: string;
  onEdit: () => void;
}

const EditableSlugline: React.FC<EditableSluglineProps> = ({
  slugline,
  placeholder = "INT. LOCATION - DAY",
  onEdit,
}) => {
  return (
    <div
      className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors relative"
      onClick={onEdit}
      onMouseEnter={(e) => {
        const icon = e.currentTarget.querySelector(".pencil-icon");
        if (icon) {
          icon.classList.remove("opacity-0");
          icon.classList.add("opacity-100");
        }
      }}
      onMouseLeave={(e) => {
        const icon = e.currentTarget.querySelector(".pencil-icon");
        if (icon) {
          icon.classList.remove("opacity-100");
          icon.classList.add("opacity-0");
        }
      }}
      title="Click to edit scene heading"
    >
      <span className="text-sm text-black font-mono uppercase">
        {slugline || placeholder}
      </span>
      <svg
        className="pencil-icon w-4 h-4 text-gray-500 opacity-0 transition-opacity duration-200"
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
    </div>
  );
};

export default EditableSlugline;

