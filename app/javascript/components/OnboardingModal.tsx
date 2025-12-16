import React, { useState } from 'react';
import ModalHeader from './ModalHeader';

type AccountType = 'company' | 'individual';
type Gender = 'male' | 'female' | 'other';

interface OnboardingData {
  account_type: AccountType;
  full_name: string;
  gender: Gender;
  company_name?: string;
}

interface OnboardingModalProps {
  onComplete: (data: OnboardingData) => Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
  initialName?: string;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({
  onComplete,
  isSubmitting = false,
  error = null,
  initialName = '',
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [fullName, setFullName] = useState(initialName);
  const [gender, setGender] = useState<Gender | null>(null);
  const [companyName, setCompanyName] = useState('');

  const handleAccountTypeSelect = (type: AccountType) => {
    setAccountType(type);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accountType || !fullName.trim() || !gender) {
      return;
    }

    if (accountType === 'company' && !companyName.trim()) {
      return;
    }

    await onComplete({
      account_type: accountType,
      full_name: fullName.trim(),
      gender,
      company_name: accountType === 'company' ? companyName.trim() : undefined,
    });
  };

  const isStep2Valid = fullName.trim() && gender && (accountType === 'individual' || companyName.trim());

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70" />
      
      {/* Modal */}
      <div className="relative w-full max-w-xl mx-4 bg-[#f5f1e8] border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        {/* Header */}
        <ModalHeader
          title="System Initialization"
          subtitle={step === 1 ? 'Step 1/2 — Account Configuration' : 'Step 2/2 — User Profile Setup'}
        />

        {/* Progress Bar */}
        <div className="h-2 bg-gray-200 border-b-2 border-black">
          <div 
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>

        {/* Content */}
        <div className="p-8">
          {error && (
            <div className="mb-6 border-2 border-red-500 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 uppercase tracking-wide">
              Error: {error}
            </div>
          )}

          {step === 1 ? (
            <div>
              <h3 className="text-2xl font-black text-black uppercase tracking-tight mb-2">
                Select Account Type
              </h3>
              <p className="text-sm font-mono text-gray-600 mb-8">
                Choose how you want to use the platform
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Option */}
                <button
                  onClick={() => handleAccountTypeSelect('company')}
                  className="group relative bg-white border-3 border-black p-6 text-left shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-200"
                >
                  <div className="absolute top-4 right-4 w-4 h-4 border-2 border-black group-hover:bg-black transition-colors"></div>
                  <div className="mb-4">
                    <svg className="w-12 h-12 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-black uppercase tracking-tight mb-2">Company</h4>
                  <p className="text-xs font-mono text-gray-600 uppercase">
                    For teams and organizations. Collaborate with multiple users.
                  </p>
                </button>

                {/* Individual Option */}
                <button
                  onClick={() => handleAccountTypeSelect('individual')}
                  className="group relative bg-white border-3 border-black p-6 text-left shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-200"
                >
                  <div className="absolute top-4 right-4 w-4 h-4 border-2 border-black group-hover:bg-black transition-colors"></div>
                  <div className="mb-4">
                    <svg className="w-12 h-12 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-black uppercase tracking-tight mb-2">Individual</h4>
                  <p className="text-xs font-mono text-gray-600 uppercase">
                    For personal use. Work solo on your projects.
                  </p>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="flex items-center gap-3 mb-6">
                <button
                  type="button"
                  onClick={handleBack}
                  className="p-2 border-2 border-black hover:bg-black hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h3 className="text-2xl font-black text-black uppercase tracking-tight">
                    {accountType === 'company' ? 'Company Details' : 'Your Profile'}
                  </h3>
                  <p className="text-xs font-mono text-gray-600 uppercase">
                    {accountType === 'company' ? 'Set up your organization' : 'Tell us about yourself'}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Company Name (only for company accounts) */}
                {accountType === 'company' && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Enter company name"
                      className="w-full px-4 py-3 border-2 border-black bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 placeholder:text-gray-400"
                      required
                    />
                  </div>
                )}

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 border-2 border-black bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 placeholder:text-gray-400"
                    required
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
                    Gender *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['male', 'female', 'other'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`px-4 py-3 border-2 border-black font-bold uppercase text-sm transition-all ${
                          gender === g
                            ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]'
                            : 'bg-white text-black hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-8">
                <button
                  type="submit"
                  disabled={!isStep2Valid || isSubmitting}
                  className={`w-full px-6 py-4 border-2 border-black font-black uppercase tracking-wider text-lg transition-all ${
                    isStep2Valid && !isSubmitting
                      ? 'bg-black text-white hover:bg-[#E0445D] shadow-[6px_6px_0px_0px_rgba(242,85,110,0.3)]'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-3">
                      <div className="h-5 w-5 animate-spin border-3 border-white border-t-transparent rounded-full"></div>
                      Initializing...
                    </span>
                  ) : (
                    'Complete Setup →'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-black bg-gray-100 px-8 py-4">
          <p className="text-[10px] font-mono text-gray-500 uppercase text-center">
            This information helps us personalize your experience
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;

