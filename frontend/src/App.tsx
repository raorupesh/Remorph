import { useState } from 'react'
import DiffMatchPatch from 'diff-match-patch'
import remorphLogo from './assets/Remporph-logo.png'
import './App.css'

const dmp = new DiffMatchPatch()

function App() {
  const [language, setLanguage] = useState('')
  const [sourceCode, setSourceCode] = useState('')
  const [refactoredCode, setRefactoredCode] = useState('')
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'code' | 'diff'>('code')

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
    setViewMode('code')

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

  const renderDiffView = () => {
    if (!sourceCode || !refactoredCode) return null

    // Compute diff-match-patch diffs
    const diffs = dmp.diff_main(sourceCode, refactoredCode)
    dmp.diff_cleanupSemantic(diffs)

    // Parse diffs into lines with proper tracking
    const diffLines: Array<{
      type: 'add' | 'remove' | 'context'
      content: string
      oldLineNum?: number
      newLineNum?: number
    }> = []

    let oldLineNum = 1
    let newLineNum = 1

    for (const [operation, text] of diffs) {
      const lines = text.split('\n')

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        // Skip the last empty line from split
        if (i === lines.length - 1 && line === '') continue

        if (operation === 0) {
          // Context (unchanged)
          diffLines.push({
            type: 'context',
            content: line,
            oldLineNum,
            newLineNum,
          })
          oldLineNum++
          newLineNum++
        } else if (operation === -1) {
          // Remove
          diffLines.push({
            type: 'remove',
            content: line,
            oldLineNum,
            newLineNum: undefined,
          })
          oldLineNum++
        } else if (operation === 1) {
          // Add
          diffLines.push({
            type: 'add',
            content: line,
            oldLineNum: undefined,
            newLineNum,
          })
          newLineNum++
        }
      }
    }

    // Filter out certain empty contexts for cleaner display
    const displayLines = diffLines.filter((line, idx) => {
      if (line.content === '') {
        // Keep empty lines only if they're between changes
        const prevLine = idx > 0 ? diffLines[idx - 1] : null
        const nextLine = idx < diffLines.length - 1 ? diffLines[idx + 1] : null
        return (prevLine?.type !== 'context' || nextLine?.type !== 'context')
      }
      return true
    })

    return (
      <div className="diff-container">
        <div className="diff-header">
          <span className="diff-file-info">📝 Code Changes (Original → Refactored)</span>
        </div>
        <table className="diff-table">
          <tbody>
            {displayLines.map((line, index) => (
              <tr key={index} className={`diff-line diff-line-${line.type}`}>
                <td className="diff-line-number diff-line-number-old" title="Original line">
                  {line.oldLineNum !== undefined ? line.oldLineNum : ''}
                </td>
                <td className="diff-line-number diff-line-number-new" title="Refactored line">
                  {line.newLineNum !== undefined ? line.newLineNum : ''}
                </td>
                <td className="diff-line-prefix">
                  {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
                </td>
                <td className="diff-line-content">
                  <code>{line.content || '\u00A0'}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
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

      {explanation && (
        <section className="explanation-section">
          <div className="section-header">
            <h2>Changes Made</h2>
          </div>
          <div className="explanation-card">
            <p className="explanation-text">{explanation}</p>
          </div>
        </section>
      )}

      {refactoredCode && (
        <section className="diff-section">
          <div className="section-header">
            <h2>Code Diff View</h2>
          </div>
          {renderDiffView()}
        </section>
      )}
    </div>
  )
}

export default App
