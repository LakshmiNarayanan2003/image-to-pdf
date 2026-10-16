import { Check, CircleCheck, Download, LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { useConverter } from './hooks/useConverter';
import { Header, Hero } from './components/Brand';
import { Workspace } from './components/Workspace';
import { Settings } from './components/Settings';
import { Info } from './components/Info';
import { formatBytes } from './lib/utils';
export default function App() {
  const session = useConverter(),
    [downloadedUrl, setDownloadedUrl] = useState('');
  const {
    dark,
    setDark,
    busy,
    progress,
    options,
    changeOptions,
    images,
    errors,
    setErrors,
    notice,
    result,
    download,
  } = session;
  return (
    <>
      <a className="skip-link" href="#converter">
        Skip to converter
      </a>
      <Header dark={dark} onToggle={() => setDark(!dark)} />
      <main>
        <Hero />
        <section
          className="converter"
          id="converter"
          aria-label="Image to PDF converter"
          tabIndex={-1}
        >
          <div className="converter-bar">
            <span>
              <span className="status-dot" /> YOUR PRIVATE WORKSPACE
            </span>
            <span>
              <LockKeyhole size={13} />
              Private by design
            </span>
          </div>
          <div className="converter-body">
            <Workspace session={session} />
            <Settings
              options={options}
              onChange={changeOptions}
              busy={busy}
              count={images.length}
              progress={progress}
              onConvert={() => void session.convert()}
              onCancel={session.cancel}
            />
          </div>
          {errors.length > 0 && (
            <div role="alert" className="message error">
              {errors.map((error, i) => (
                <p key={i}>{error}</p>
              ))}
              <button className="text-button" onClick={() => setErrors([])}>
                Dismiss errors
              </button>
            </div>
          )}
          <div role="status" aria-live="polite" aria-atomic="true">
            {notice && (
              <div className={`message ${result ? 'success' : ''}`}>
                <CircleCheck size={20} />
                <span>
                  {notice}
                  {result && (
                    <small className="result-detail">
                      {result.name} · {result.pages} page
                      {result.pages === 1 ? '' : 's'} ·{' '}
                      {formatBytes(result.blob.size)}
                    </small>
                  )}
                </span>
                {result && (
                  <a
                    ref={download}
                    className="button primary"
                    href={result.url}
                    download={result.name}
                    onClick={() => setDownloadedUrl(result.url)}
                  >
                    <Download size={17} />
                    {downloadedUrl === result.url
                      ? 'Download again'
                      : 'Download PDF'}
                  </a>
                )}
              </div>
            )}
          </div>
        </section>
        <div className="under-converter">
          <span>
            <Check size={14} />
            Many images. One PDF.
          </span>
          <span>
            <LockKeyhole size={14} />
            No uploads. No account.
          </span>
          <span>
            <Check size={14} />
            No paid quotas.
          </span>
        </div>
        <Info />
      </main>
    </>
  );
}
