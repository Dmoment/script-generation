import React, { useState, useEffect, useRef, useMemo } from 'react';
import ModalHeader from './ModalHeader';
import FilterDropdown from './FilterDropdown';
import { colors } from '../lib/theme';
import type { Project } from '../types/api';

interface CreateScriptModalProps {
  projects: Project[];
  onClose: () => void;
  onCreate: (data: { project_id: number | string; title: string }) => Promise<void>;
  onUpload: (data: { project_id: number | string; title: string; file: File; notes?: string }) => Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
}

const CreateScriptModal: React.FC<CreateScriptModalProps> = ({
  projects,
  onClose,
  onCreate,
  onUpload,
  isSubmitting = false,
  error = null,
}) => {
  const [mode, setMode] = useState<'create' | 'upload'>('create');
  const [projectId, setProjectId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileNotes, setFileNotes] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const restoreTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert projects to dropdown options
  const projectOptions = useMemo(() => {
    return projects.map((project) => ({
      value: String(project.id),
      label: project.title || 'Untitled Project',
    }));
  }, [projects]);

  // Auto-select first project if only one exists
  useEffect(() => {
    if (projects.length === 1 && !projectId) {
      setProjectId(String(projects[0].id));
    }
  }, [projects, projectId]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectId) {
      return;
    }

    if (mode === 'create') {
      if (!title.trim()) {
        return;
      }
      await onCreate({
        project_id: projectId,
        title: title.trim(),
      });
    } else {
      if (!selectedFile || !title.trim()) {
        return;
      }
      await onUpload({
        project_id: projectId,
        title: title.trim(),
        file: selectedFile,
        notes: fileNotes.trim() || undefined,
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill title if empty
      if (!title.trim()) {
        const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
        setTitle(fileName);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!title.trim()) {
        const fileName = file.name.replace(/\.[^/.]+$/, '');
        setTitle(fileName);
      }
    }
  };

  const isValid = projectId.trim().length > 0 && 
    (mode === 'create' ? title.trim().length > 0 : (title.trim().length > 0 && selectedFile !== null));

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
          <span>Restore Script Creation</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto py-8" onClick={onClose}>
      {/* Backdrop with blur */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-md" />
      
      {/* Modal */}
      <div 
        className={`relative bg-[#F8F1E8] border-4 border-black transition-all duration-300 flex flex-col my-8 ${
          isMaximized 
            ? 'w-[95vw] min-h-[95vh]' 
            : 'w-full max-w-md'
        }`} 
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <ModalHeader
          title="Create New Script"
          subtitle="Start your script"
          onClose={onClose}
          onMaximize={() => setIsMaximized(!isMaximized)}
          onMinimize={() => setIsMinimized(true)}
          isMaximized={isMaximized}
        />

        {/* Progress Bar */}
        <div className="h-2 bg-gray-200 border-b-2 border-black flex-shrink-0">
          <div className="h-full bg-green-500" style={{ width: '100%' }} />
        </div>

        {/* Content - No internal scrollbar */}
        <div className="p-8">
          {error && (
            <div className="mb-6 border-2 border-red-500 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 uppercase tracking-wide">
              Error: {error}
            </div>
          )}

          {/* Mode Toggle */}
          <div className="mb-6 flex border-2 border-black bg-white">
            <button
              type="button"
              onClick={() => setMode('create')}
              className={`flex-1 px-4 py-3 text-sm font-bold uppercase transition-colors ${
                mode === 'create'
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              <i className="bi bi-pencil-square mr-2"></i>
              Create New
            </button>
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`flex-1 px-4 py-3 text-sm font-bold uppercase transition-colors border-l-2 border-black ${
                mode === 'upload'
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              <i className="bi bi-upload mr-2"></i>
              Upload File
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Project Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
                  Project *
                </label>
                <FilterDropdown
                  options={projectOptions}
                  value={projectId}
                  onChange={setProjectId}
                  placeholder="Select a project"
                />
              </div>

              {/* Script Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
                  Script Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter script title"
                  className="w-full px-4 py-3 border-2 border-black bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 placeholder:text-gray-400 transition-all duration-200"
                  style={{
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                  }}
                  required
                  autoFocus
                />
              </div>

              {/* Upload Mode: File Upload */}
              {mode === 'upload' && (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
                      Script File *
                    </label>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed p-8 text-center transition-colors ${
                        isDragging
                          ? 'border-blue-500 bg-blue-50'
                          : selectedFile
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-400 bg-gray-50'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileSelect}
                        accept=".fdx,.sbx,.pdf,.txt,.fountain"
                        className="hidden"
                      />
                      {selectedFile ? (
                        <div className="space-y-2">
                          <i className="bi bi-file-earmark-text text-4xl text-gray-600"></i>
                          <p className="text-sm font-mono text-gray-700 font-bold">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFile(null);
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                            }}
                            className="text-xs text-red-600 hover:text-red-800 underline font-bold"
                          >
                            Remove file
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex justify-center">
                            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                              <i className="bi bi-cloud-upload text-4xl text-blue-600"></i>
                            </div>
                          </div>
                          <p className="text-sm font-mono text-gray-700 font-bold">
                            Drag & drop screenplay file anywhere, or{' '}
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="text-blue-600 underline hover:text-blue-800"
                            >
                              browse
                            </button>
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            Supported file types: .fdx / .sbx / .pdf / .txt / .fountain
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upload Notes */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
                      Version Notes (Optional)
                    </label>
                    <textarea
                      value={fileNotes}
                      onChange={(e) => setFileNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-black bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 resize-none placeholder:text-gray-400"
                      placeholder="Add notes about this version..."
                      style={{
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                      }}
                    />
                  </div>
                </>
              )}
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
                  mode === 'create' ? 'Create Script →' : 'Upload Script →'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-black bg-gray-100 px-8 py-4 flex-shrink-0">
          <p className="text-[10px] font-mono text-gray-500 uppercase text-center">
            You can add more details later
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateScriptModal;

