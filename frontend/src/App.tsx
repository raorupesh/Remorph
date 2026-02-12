import { useState } from 'react'
import remorphLogo from './assets/Remporph-logo.png'
import './App.css'

function App() {
  const [language, setLanguage] = useState('')
  const [sourceCode, setSourceCode] = useState('')
  const [refactoredCode, setRefactoredCode] = useState('')
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const content = await file.text()
      setSourceCode(content)
      
      // Try to detect language from file extension
      const extension = file.name.split('.').pop()?.toLowerCase()
      const languageMap: Record<string, string> = {
        js: 'javascript',
        ts: 'typescript',
        py: 'python',
        java: 'java',
        cs: 'csharp',
        cpp: 'cpp',
        c: 'cpp',
        go: 'go',
        rb: 'ruby',
        php: 'php',
      }
      if (extension && languageMap[extension]) {
        setLanguage(languageMap[extension])
      }
    } catch (err) {
      setError('Failed to read file. Please try again.')
    }
  }

  const handleRefactor = async () => {
    if (!language.trim() || !sourceCode.trim()) return

    setLoading(true)
    setError(null)
    setRefactoredCode('')
    setExplanation('')

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

      const data: { refactoredCode?: string; explanation?: string } = await response.json()
      setRefactoredCode(data.refactoredCode ?? '')
      setExplanation(data.explanation ?? '')
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

          <div className="field-row">
            <label className="field-label" htmlFor="file-upload">
              Or upload a file
            </label>
            <input
              id="file-upload"
              type="file"
              onChange={handleFileUpload}
              className="field-file"
              accept=".js,.ts,.py,.java,.cs,.cpp,.go,.rb,.php"
            />
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
            <h2>Refactored code & explanation</h2>
            <span className="pane-tag">Output</span>
          </div>

          {explanation && (
            <div className="explanation-box">
              <h3 className="explanation-title">Changes Made</h3>
              <p className="explanation-text">{explanation}</p>
            </div>
          )}

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
