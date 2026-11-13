
import { useEffect, useState } from 'react'
import './App.css'

const MAX_FILE_SIZE = 10 * 1024 * 1024

function useObjectUrl(file) {
  const [url, setUrl] = useState('')

  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) {
      setUrl('')
      return undefined
    }

    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  return url
}

function isPdf(file) {
  return (
    file.type === 'application/pdf' ||
    file.name.toLowerCase().endsWith('.pdf')
  )
}

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function App() {
  const [theme, setTheme] = useState('light')
  const [file, setFile] = useState(null)
  const [question, setQuestion] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [recentFiles, setRecentFiles] = useState([])
  const [activeView, setActiveView] = useState('workspace')

  const previewUrl = useObjectUrl(file)

  function clearMessages() {
    setError('')
    setStatus('')
  }

  function handleFile(selectedFile) {
    if (!selectedFile) return

    const validImage = selectedFile.type.startsWith('image/')
    const validPdf = isPdf(selectedFile)

    if (!validImage && !validPdf) {
      setError('Choose a supported image or document.')
      setStatus('')
      return
    }

    if (selectedFile.size === 0) {
      setError('This file is empty. Please choose another.')
      setStatus('')
      return
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('The maximum allowed file size is 10 MB.')
      setStatus('')
      return
    }

    setFile(selectedFile)
    setQuestion('')
    clearMessages()
    setActiveView('workspace')

    setRecentFiles((previous) => {
      const filtered = previous.filter(
        (item) =>
          item.name !== selectedFile.name ||
          item.size !== selectedFile.size,
      )

      return [
        {
          id: `${selectedFile.name}-${selectedFile.size}-${Date.now()}`,
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type,
          file: selectedFile,
        },
        ...filtered,
      ].slice(0, 8)
    })
  }

  function removeFile() {
    setFile(null)
    clearMessages()
  }

  function selectRecentFile(item) {
    setFile(item.file)
    setQuestion('')
    clearMessages()
    setActiveView('workspace')
  }

  function handleDrop(event) {
    event.preventDefault()
    setIsDragging(false)
    handleFile(event.dataTransfer.files?.[0])
  }

  function handleSubmit(event) {
    event.preventDefault()
    clearMessages()

    if (!file) {
      setError('Please upload your notes before continuing.')
      return
    }

    if (!question.trim()) {
      setError('Enter a question about your notes.')
      return
    }

    setStatus(
      'Your document and question are ready. AI answers will be available once the Python processing pipeline is connected.',
    )
  }

  return (
    <div className={`app theme-${theme}`}>
      <aside className="sidebar">
        <button
          type="button"
          className="brand"
          onClick={() => setActiveView('workspace')}
          aria-label="Scripta home"
        >
          <span className="brand-mark">s.</span>
          <span className="brand-name">
            scripta<span>.</span>
          </span>
        </button>

        <div className="sidebar-label">MENU</div>

        <button
          type="button"
          className={`nav-item ${
            activeView === 'workspace' ? 'active' : ''
          }`}
          onClick={() => setActiveView('workspace')}
        >
          <span className="nav-icon" aria-hidden="true">⌂</span>
          <span>Workspace</span>
        </button>

        <button
          type="button"
          className={`nav-item ${
            activeView === 'library' ? 'active' : ''
          }`}
          onClick={() => setActiveView('library')}
        >
          <span className="nav-icon" aria-hidden="true">▤</span>
          <span>My documents</span>
          <span className="nav-count">{recentFiles.length}</span>
        </button>

        <div className="sidebar-divider" />

        <div className="sidebar-label">RECENT</div>

        <div className="recent-list">
          {recentFiles.length === 0 ? (
            <p className="empty-recent">
              No recent documents.
            </p>
          ) : (
            recentFiles.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`recent-item ${
                  file?.name === item.name &&
                  file?.size === item.size
                    ? 'recent-active'
                    : ''
                }`}
                onClick={() => selectRecentFile(item)}
                title={item.name}
              >
                <span className="recent-file-icon">
                  {item.file.type.startsWith('image/') ? 'IMG' : 'DOC'}
                </span>
                <span className="recent-file-name">{item.name}</span>
              </button>
            ))
          )}
        </div>

        <div className="sidebar-bottom">
          <button
            type="button"
            className="theme-toggle"
            onClick={() =>
              setTheme((current) =>
                current === 'light' ? 'dark' : 'light',
              )
            }
            aria-label={`Switch to ${
              theme === 'light' ? 'dark' : 'light'
            } appearance`}
          >
            <span className="theme-icon" aria-hidden="true">
              {theme === 'light' ? '☾' : '☀'}
            </span>
            <span>
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
            </span>
            <span className="toggle-indicator" aria-hidden="true" />
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Scripta</span>
            <span className="breadcrumb-separator">/</span>
            <strong>
              {activeView === 'library'
                ? 'My documents'
                : 'Workspace'}
            </strong>
          </div>

          <div className="topbar-status">
            <span className="status-dot" />
            <span>Personal workspace</span>
          </div>
        </header>

        {activeView === 'library' ? (
          <section className="library-page">
            <span className="eyebrow">DOCUMENTS</span>

            <h1>My documents</h1>

            <p className="page-description">
              Your recently selected documents.
            </p>

            {recentFiles.length === 0 ? (
              <div className="empty-library">
                <span className="empty-library-icon" aria-hidden="true">
                  ▤
                </span>

                <h2>No documents yet</h2>

                <p>
                  Upload your first document to get started.
                </p>

                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setActiveView('workspace')}
                >
                  Go to workspace <span>→</span>
                </button>
              </div>
            ) : (
              <div className="library-grid">
                {recentFiles.map((item) => (
                  <button
                    type="button"
                    className="library-card"
                    key={item.id}
                    onClick={() => selectRecentFile(item)}
                  >
                    <span className="library-card-icon">
                      {item.file.type.startsWith('image/') ? 'IMG' : 'DOC'}
                    </span>

                    <strong>{item.name}</strong>

                    <span>{formatFileSize(item.size)}</span>

                    <span className="library-open">
                      Open document →
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        ) : (
          <div className="page-content">
            <section className="hero">
              <span className="eyebrow">
                HANDWRITTEN NOTES
              </span>

              <h1>
                Your notes.
                <br />
                <em>Your questions.</em>
              </h1>

              <p>
                Upload your handwritten pages and ask questions
                about their content.
              </p>
            </section>

            <div className="workspace-intro">
              <div>
                <span className="section-kicker">WORKSPACE</span>
                <h2>Get started</h2>
              </div>

              <div className="step-counter">
                <span className="step-number">01</span>
                <span>Upload</span>
                <span className="step-line" />
                <span className="step-number">02</span>
                <span>Ask</span>
              </div>
            </div>

            <form className="workspace-grid" onSubmit={handleSubmit}>
              <section className="panel upload-panel">
                <div className="panel-heading">
                  <div>
                    <span className="panel-index">01 / UPLOAD</span>
                    <h3>Your document</h3>
                    <p>Select or drop your handwritten notes.</p>
                  </div>

                  <span className="heading-symbol" aria-hidden="true">
                    ↗
                  </span>
                </div>

                <div
                  className={`dropzone ${
                    isDragging ? 'dropzone-active' : ''
                  } ${file ? 'has-file' : ''}`}
                  onDragOver={(event) => {
                    event.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={(event) => {
                    if (
                      !event.currentTarget.contains(event.relatedTarget)
                    ) {
                      setIsDragging(false)
                    }
                  }}
                  onDrop={handleDrop}
                >
                  <input
                    id="notes-file"
                    type="file"
                    accept="image/*,.pdf,application/pdf"
                    onChange={(event) => {
                      handleFile(event.target.files?.[0])
                      event.target.value = ''
                    }}
                    aria-label="Choose a handwritten notes image or document"
                  />

                  {file && previewUrl ? (
                    <div className="preview-frame">
                      <img
                        src={previewUrl}
                        alt={`Preview of ${file.name}`}
                      />

                      <span className="preview-label">
                        PREVIEW
                      </span>
                    </div>
                  ) : (
                    <div className="dropzone-placeholder">
                      <span className="upload-symbol" aria-hidden="true">
                        {file ? '✓' : '↑'}
                      </span>

                      <strong>
                        {file
                          ? 'Document ready'
                          : 'Upload your notes'}
                      </strong>

                      <span>
                        {file
                          ? 'Your document has been selected.'
                          : 'Drag and drop or browse your files.'}
                      </span>

                      <label
                        className="browse-link"
                        htmlFor="notes-file"
                      >
                        Choose a file
                      </label>
                    </div>
                  )}

                  <span className="file-formats">
                    JPG · PNG · WEBP
                  </span>
                </div>

                {file && (
                  <div className="selected-file">
                    <div className="file-type-icon">
                      {file.type.startsWith('image/') ? 'IMG' : 'DOC'}
                    </div>

                    <div className="selected-file-info">
                      <strong>{file.name}</strong>

                      <span>
                        {formatFileSize(file.size)} · Ready
                      </span>
                    </div>

                    <button
                      type="button"
                      className="remove-button"
                      onClick={removeFile}
                      aria-label={`Remove ${file.name}`}
                    >
                      Remove
                    </button>
                  </div>
                )}

                <div className="upload-footer">
                  <span className="secure-mark" aria-hidden="true">
                    ✓
                  </span>

                  <span>Maximum 10 MB</span>

                  <span className="footer-separator">·</span>

                  <span>Local preview</span>
                </div>
              </section>

              <section className="panel question-panel">
                <div className="panel-heading">
                  <div>
                    <span className="panel-index">02 / QUESTION</span>
                    <h3>What would you like to know?</h3>
                    <p>Ask something about your document.</p>
                  </div>

                  <span className="heading-symbol" aria-hidden="true">
                    ✳
                  </span>
                </div>

                <label className="question-label" htmlFor="question">
                  YOUR QUESTION
                </label>

                <textarea
                  id="question"
                  value={question}
                  onChange={(event) => {
                    setQuestion(event.target.value)
                    clearMessages()
                  }}
                  placeholder="Type your question here..."
                  maxLength={1000}
                  rows={7}
                  aria-describedby="question-meta"
                />

                <div className="question-meta" id="question-meta">
                  <span>
                    {file ? 'Document selected' : 'No document selected'}
                  </span>

                  <span>{question.length}/1000</span>
                </div>

                <button className="primary-button" type="submit">
                  <span>Submit question</span>

                  <span className="button-arrow" aria-hidden="true">
                    →
                  </span>
                </button>

                <p className="processing-note">
                  <span aria-hidden="true">✳</span>
                  AI processing will be available once the Python
                  pipeline is connected.
                </p>

                {error && (
                  <div className="message error-message" role="alert">
                    {error}
                  </div>
                )}

                {status && (
                  <div className="message success-message" role="status">
                    {status}
                  </div>
                )}
              </section>
            </form>

            <footer className="page-footer">
              <span>Scripta</span>
              <span>SCRIPTA © 2026</span>
            </footer>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
