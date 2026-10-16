import {
  Code2,
  Sun,
  Moon,
  ArrowUpRight,
  ShieldCheck,
  LockKeyhole,
} from 'lucide-react';
export const SOURCE = 'https://github.com/LakshmiNarayanan2003/image-to-pdf';
export function Header({
  dark,
  onToggle,
}: {
  dark: boolean;
  onToggle: () => void;
}) {
  return (
    <header className="site-header">
      <a className="wordmark" href="#">
        <img
          src={`${import.meta.env.BASE_URL}favicon.svg`}
          width="32"
          height="32"
          alt=""
        />
        Pix2PDF<span className="open-badge">OPEN SOURCE</span>
      </a>
      <nav aria-label="Main">
        <a href="#converter">Converter</a>
        <a href="#how-it-works">How it works</a>
        <a href="#privacy">Privacy</a>
      </nav>
      <div className="header-actions">
        <a
          href={SOURCE}
          className="github-link"
          target="_blank"
          rel="noreferrer"
        >
          <Code2 size={17} />
          <span>GitHub</span>
          <ArrowUpRight size={13} />
        </a>
        <button
          className="icon-button"
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={onToggle}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
export function Hero() {
  return (
    <section className="hero">
      <div className="eyebrow">
        <span className="status-dot" /> THE LOCAL IMAGE CONVERTER
      </div>
      <h1>
        Images in. <em>PDF out.</em>
      </h1>
      <p>
        Combine JPG, PNG, WebP, HEIC and more into one clean PDF.
        <br />
        Right in your browser. Keep every image private.
      </p>
      <div className="trust-points">
        <span>
          <ShieldCheck size={16} /> On your device
        </span>
        <span>
          <LockKeyhole size={15} /> Nothing uploaded
        </span>
        <span>
          <Code2 size={16} /> Free & open source
        </span>
      </div>
    </section>
  );
}
