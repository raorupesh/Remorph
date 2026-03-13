import { useState } from 'react'
import ReactDiffViewer from 'react-diff-viewer-continued'
import remorphLogo from './assets/Remporph-logo.png'
import './App.css'

const githubDiffStyles = {
  variables: {
    light: {
      diffViewerBackground: '#ffffff',
      diffViewerColor: '#24292f',
      diffViewerTitleBackground: '#f6f8fa',
      diffViewerTitleColor: '#24292f',
      diffViewerTitleBorderColor: '#d0d7de',
      gutterBackground: '#f6f8fa',
      gutterBackgroundDark: '#eef2f6',
      gutterColor: '#57606a',
      addedBackground: '#e6ffec',
      addedGutterBackground: '#ccffd8',
      addedColor: '#24292f',
      removedBackground: '#ffebe9',
      removedGutterBackground: '#ffd7d5',
      removedColor: '#24292f',
      wordAddedBackground: '#abf2bc',
      wordRemovedBackground: '#ffc1ba',
      codeFoldBackground: '#f6f8fa',
      codeFoldGutterBackground: '#f6f8fa',
      codeFoldContentColor: '#57606a',
      emptyLineBackground: '#ffffff',
      highlightBackground: '#fff8c5',
      highlightGutterBackground: '#fff1a8',
    },
  },
  diffContainer: {
    border: '1px solid #d0d7de',
    borderRadius: '6px',
    minWidth: '100%',
    fontSize: '13px',
  },
  titleBlock: {
    padding: '10px 12px',
    fontSize: '12px',
    fontWeight: 600,
    lineHeight: '20px',
  },
  contentText: {
    fontFamily: "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, 'Liberation Mono', monospace",
    fontSize: '12px',
    lineHeight: '20px',
  },
  lineNumber: {
    fontSize: '12px',
  },
  gutter: {
    minWidth: '44px',
    width: '44px',
    padding: '0 8px',
  },
  marker: {
    width: '24px',
    minWidth: '24px',
    padding: '0 6px',
  },
}

interface CodeSmell {
  type: string
  function?: string
  functions?: string[]
  location?: string
  details: string
  similarity?: number
}

interface CodeSmellAnalysis {
  detected: CodeSmell[]
  summary: {
    totalFunctions: number
    totalSmells: number
    functions: Array<{
      name: string
      statements: number
      lines: number
    }>
  }
}

function App() {
  const [language, setLanguage] = useState('')
  const [sourceCode, setSourceCode] = useState('')
  const [refactoredCode, setRefactoredCode] = useState('')
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [codeSmellAnalysis, setCodeSmellAnalysis] = useState<CodeSmellAnalysis | null>(null)

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
    setCodeSmellAnalysis(null)

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

      const data: {
        refactoredCode?: string
        explanation?: string
        codeSmellAnalysis?: CodeSmellAnalysis
      } = await response.json()
      setRefactoredCode(data.refactoredCode ?? '')
      setExplanation(data.explanation ?? '')
      setCodeSmellAnalysis(data.codeSmellAnalysis ?? null)
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

      <div className="top-layout">
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
            <h2>Refactored code</h2>
            <span className="pane-tag">Output</span>
          </div>

          {refactoredCode && (
            <textarea
              id="refactored"
              value={refactoredCode}
              readOnly
              placeholder="Refactored code will appear here."
            />
          )}

          {!refactoredCode && (
            <div className="empty-state">
              <p>Refactored code will appear here</p>
            </div>
          )}
        </section>
      </div>

      {codeSmellAnalysis && codeSmellAnalysis.detected.length > 0 && (
        <section className="code-smell-section">
          <div className="section-header">
            <h2>Detected Code Smells</h2>
          </div>
          <div className="code-smell-list">
            {codeSmellAnalysis.detected.map((smell, index) => (
              <div key={index} className="code-smell-item">
                <div className="code-smell-header">
                  <span className="code-smell-type">{smell.type}</span>
                  <span className="code-smell-location">
                    {smell.function && `in function '${smell.function}'`}
                    {smell.functions && `between '${smell.functions.join("' and '")}'`}
                  </span>
                </div>
                <p className="code-smell-details">{smell.details}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {explanation && (
        <section className="explanation-section">
          <div className="section-header">
            <h2>Changes Made</h2>
          </div>
          <div className="explanation-card">
            <ul className="explanation-list">
              {explanation
                .split('\n')
                .filter((line) => line.trim())
                .map((line, index) => (
                  <li key={index} className="explanation-item">
                    {line.replace(/\*\*/g, '').trim()}
                  </li>
                ))}
            </ul>
          </div>
        </section>
      )}

      {refactoredCode && (
        <section className="diff-section">
          <div className="section-header">
            <h2>Code Diff View</h2>
          </div>
          <div className="diff-viewer-container">
            <div className="github-diff-meta">
              <span className="github-diff-file">refactor-result.{language || 'txt'}</span>
            </div>
            <div className="diff-tags-row" aria-label="Diff column labels">
              <span className="diff-tag diff-tag-original">Original Code</span>
              <span className="diff-tag diff-tag-refactored">Refactored Code</span>
            </div>
            <ReactDiffViewer
              oldValue={sourceCode}
              newValue={refactoredCode}
              splitView={true}
              hideLineNumbers={false}
              showDiffOnly={false}
              useDarkTheme={false}
              styles={githubDiffStyles}
            />
          </div>
        </section>
      )}
    </div>
  )
}

export default App
