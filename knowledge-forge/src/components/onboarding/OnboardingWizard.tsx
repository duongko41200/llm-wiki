import { useState, useEffect } from 'react';
import { Database, Download, FileText, CheckCircle } from 'lucide-react';

export const OnboardingWizard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('knowledgeforge_onboarding_done');
    if (!hasSeenOnboarding) {
      setIsOpen(true);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem('knowledgeforge_onboarding_done', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        backgroundColor: 'var(--bg-sidebar)',
        padding: '2rem',
        borderRadius: '12px',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        color: 'var(--text-main)',
        border: '1px solid var(--border-color)'
      }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#3b82f6' }}>
          <Database size={24} /> Welcome to KnowledgeForge!
        </h2>

        {step === 1 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <Download size={32} color="#10b981" />
              <div>
                <h3>Step 1: Install Ollama</h3>
                <p style={{ color: 'var(--text-muted)' }}>KnowledgeForge runs locally. Please make sure Ollama is installed and running on your system.</p>
              </div>
            </div>
            <button 
              onClick={() => setStep(2)}
              style={{ width: '100%', padding: '0.75rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '1rem' }}>
              Next
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <FileText size={32} color="#f59e0b" />
              <div>
                <h3>Step 2: Upload Documents</h3>
                <p style={{ color: 'var(--text-muted)' }}>Go to the Documents tab and drop your PDF or Markdown files. The system will extract knowledge automatically.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button 
                onClick={() => setStep(1)}
                style={{ flex: 1, padding: '0.75rem', backgroundColor: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}>
                Back
              </button>
              <button 
                onClick={() => setStep(3)}
                style={{ flex: 1, padding: '0.75rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Next
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <CheckCircle size={32} color="#8b5cf6" />
              <div>
                <h3>Step 3: Chat with your Data</h3>
                <p style={{ color: 'var(--text-muted)' }}>Navigate to the Chat tab to query your built wiki, compare documents, or generate quizzes!</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button 
                onClick={() => setStep(2)}
                style={{ flex: 1, padding: '0.75rem', backgroundColor: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}>
                Back
              </button>
              <button 
                onClick={handleComplete}
                style={{ flex: 1, padding: '0.75rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Get Started
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
