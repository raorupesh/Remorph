import { useState } from 'react'
import remorphLogo from './assets/Remporph-logo.png'
import './App.css'

function App() {
  const [language, setLanguage] = useState('')
  const [sourceCode, setSourceCode] = useState('')
  const [refactoredCode, setRefactoredCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRefactor = async () => {
    if (!language.trim() || !sourceCode.trim()) return

    setLoading(true)
    setError(null)
    setRefactoredCode('')

    try {
      const response = await fetch('http://localhost:3000/api/refactor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: sourceCode, language }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to refactor code')
      }

      const data: { refactoredCode?: string } = await response.json()
      setRefactoredCode(data.refactoredCode ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="brand-block">
          <img src={remorphLogo} alt="Remorph logo" className="brand-logo" />
          <div>
            <p className="brand-kicker">Remorph Studio</p>
            <h1 className="brand-title">AI-powered code refactoring</h1>
            <p className="brand-subtitle">Choose a language, paste code, and review the result.</p>
          </div>
        </div>
        <div className="status-pill">
          <span className="status-dot" />
          Ready
        </div>
      </header>

      <main className="main-layout">
        <section className="pane">
          <div className="pane-header">
            <h2>Source code</h2>
            <span className="pane-tag">Input</span>
          </div>

          <div className="field-row">
            <label className="field-label" htmlFor="language">
              Select language
            </label>
            <select
              id="language"
              className="field-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="" disabled>
                Choose a language...
              </option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="csharp">C#</option>
              <option value="cpp">C++</option>
              <option value="go">Go</option>
              <option value="ruby">Ruby</option>
              <option value="php">PHP</option>
            </select>
          </div>

          <textarea
            id="source"
            value={sourceCode}
            onChange={(e) => setSourceCode(e.target.value)}
            placeholder="Paste your source code here..."
          />

          <div className="actions-row">
            <button
              className="refactor-button"
              onClick={handleRefactor}
              disabled={loading || !language.trim() || !sourceCode.trim()}
            >
              {loading ? 'Refactoring...' : 'Refactor'}
            </button>
            {error && <span className="error-text">{error}</span>}
          </div>
        </section>

        <section className="pane">
          <div className="pane-header">
            <h2>Refactored code</h2>
            <span className="pane-tag">Output</span>
          </div>

          <textarea
            id="refactored"
            value={refactoredCode}
            readOnly
            placeholder="Refactored code will appear here."
          />
        </section>
      </main>
    </div>
  )
}

export default App
