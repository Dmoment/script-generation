import React, { useState, useEffect, useRef } from 'react';
import ModalHeader from './ModalHeader';
import SearchableDropdown from './SearchableDropdown';
import { colors } from '../lib/theme';

interface CreateProjectModalProps {
  onClose: () => void;
  onCreate: (data: { title: string; project_type: string }) => Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  onClose,
  onCreate,
  isSubmitting = false,
  error = null,
}) => {
  const [title, setTitle] = useState('');
  const [projectType, setProjectType] = useState<string>('');
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const restoreTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      return;
    }

    await onCreate({
      title: title.trim(),
      project_type: projectType,
    });
  };

  const isValid = title.trim().length > 0 && projectType.trim().length > 0;

  // Auto-close after 5 seconds when minimized
  useEffect(() => {
    if (isMinimized) {
      setRestoreProgress(0);
      const duration = 5000; // 5 seconds
      const interval = 50; // Update every 50ms for smooth animation
      const steps = duration / interval;

      // Progress animation
      progressIntervalRef.current = setInterval(() => {
        setRestoreProgress((prev) => {
          const next = prev + (100 / steps);
          return next >= 100 ? 100 : next;
        });
      }, interval);

      // Auto-close timer - button will vanish after timer completes
      restoreTimerRef.current = setTimeout(() => {
        setIsMinimized(false);
        setRestoreProgress(0);
        onClose(); // Close the modal completely
      }, duration);

      return () => {
        if (restoreTimerRef.current) {
          clearTimeout(restoreTimerRef.current);
        }
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      };
    } else {
      setRestoreProgress(0);
    }
  }, [isMinimized, onClose]);

  // Manual restore handler
  const handleRestore = () => {
    if (restoreTimerRef.current) {
      clearTimeout(restoreTimerRef.current);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    setIsMinimized(false);
    setRestoreProgress(0);
  };

  // Don't render if minimized
  if (isMinimized) {
    const circumference = 2 * Math.PI * 18; // radius = 18
    const offset = circumference - (restoreProgress / 100) * circumference;

    return (
      <div className="fixed bottom-4 right-4 z-[9999]">
        <button
          onClick={handleRestore}
          className="relative px-4 py-2 bg-[#F8F1E8] border-2 border-black shadow-lg hover:shadow-xl transition-all font-bold uppercase text-xs flex items-center gap-2"
        >
          <div className="relative w-5 h-5 flex-shrink-0">
            {/* Background circle */}
            <svg className="w-5 h-5 transform -rotate-90" viewBox="0 0 40 40">
              <circle
                cx="20"
                cy="20"
                r="18"
                stroke="rgba(0, 0, 0, 0.1)"
                strokeWidth="3"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="20"
                cy="20"
                r="18"
                stroke={colors.primary.pink}
                strokeWidth="3"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-50"
              />
            </svg>
            {/* Center dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: colors.primary.pink }}
              />
            </div>
          </div>
          <span>Restore Project Creation</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto">
      {/* Backdrop with blur */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-md" />
      
      {/* Modal */}
      <div className={`relative bg-[#F8F1E8] border-4 border-black transition-all duration-300 ${
        isMaximized 
          ? 'w-[95vw] h-[95vh] m-4' 
          : 'w-full max-w-md mx-4'
      }`} style={{
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
      }}>
        {/* Header */}
        <ModalHeader
          title="Create New Project"
          subtitle="Start your creative journey"
          onClose={onClose}
          onMaximize={() => setIsMaximized(!isMaximized)}
          onMinimize={() => setIsMinimized(true)}
          isMaximized={isMaximized}
        />

        {/* Progress Bar */}
        <div className="h-2 bg-gray-200 border-b-2 border-black">
          <div className="h-full bg-green-500" style={{ width: '100%' }} />
        </div>

        {/* Content */}
        <div className={`p-8 ${isMaximized ? 'overflow-y-auto' : ''}`} style={isMaximized ? { maxHeight: 'calc(95vh - 120px)' } : {}}>
          {error && (
            <div className="mb-6 border-2 border-red-500 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 uppercase tracking-wide">
              Error: {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Project Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
                  Project Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter project title"
                  className="w-full px-4 py-3 border-2 border-black bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 placeholder:text-gray-400 transition-all duration-200"
                  style={{
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                  }}
                  required
                  autoFocus
                />
              </div>

              {/* Project Type */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
                  Project Type *
                </label>
                <SearchableDropdown
                  value={projectType}
                  onChange={setProjectType}
                  placeholder="Type to search or create project type..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-4 border-2 border-black font-black uppercase tracking-wider text-lg transition-all duration-200 bg-white text-black hover:bg-gray-50"
                style={{
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className={`flex-1 px-6 py-4 border-2 border-black font-black uppercase tracking-wider text-lg transition-all duration-200 ${
                  isValid && !isSubmitting
                    ? 'text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                style={
                  isValid && !isSubmitting
                    ? {
                        backgroundColor: colors.primary.pink,
                        borderColor: colors.primary.pink,
                        boxShadow: '0 10px 15px -3px rgba(242, 85, 110, 0.3), 0 4px 6px -2px rgba(242, 85, 110, 0.2)',
                      }
                    : {}
                }
                onMouseEnter={(e) => {
                  if (isValid && !isSubmitting) {
                    e.currentTarget.style.backgroundColor = colors.primary.pinkDark;
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(224, 68, 93, 0.4), 0 4px 6px -2px rgba(224, 68, 93, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (isValid && !isSubmitting) {
                    e.currentTarget.style.backgroundColor = colors.primary.pink;
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(242, 85, 110, 0.3), 0 4px 6px -2px rgba(242, 85, 110, 0.2)';
                  }
                }}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="h-5 w-5 animate-spin border-3 border-white border-t-transparent rounded-full"></div>
                    Creating...
                  </span>
                ) : (
                  'Create Project →'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-black bg-gray-100 px-8 py-4">
          <p className="text-[10px] font-mono text-gray-500 uppercase text-center">
            You can add more details later
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectModal;

