import { ArrowUpRight, ShieldCheck, Layers3, Code2 } from 'lucide-react';
import { SOURCE } from './Brand';
const faq = [
  [
    'Does Pix2PDF upload my images?',
    'No. Your browser reads and decodes the files, creates a PDF in memory, and gives you a local download. There is no conversion server, analytics, account or image history. The hosting provider receives normal requests for the website’s static assets.',
  ],
  [
    'Which image formats can I use?',
    'JPG/JPEG/JFIF, PNG, WebP, BMP, GIF, static SVG and ICO. AVIF depends on your browser’s decoder. HEIC/HEIF uses bundled libheif; standard TIFF uses a bundled local decoder. Some uncommon codecs and TIFF variants are unsupported. RAW camera files and JPEG XL are not supported.',
  ],
  [
    'Can I combine and reorder multiple images?',
    'Yes. Every image becomes a page in one PDF, in the exact order shown. Drag the handles or use the move arrows. You can rotate and remove pages, and add more images at any time before conversion.',
  ],
  [
    'Does it work with iPhone HEIC photos?',
    'Supported HEIC/HEIF images are decoded locally to 8-bit RGB. The primary image becomes one page; depth maps, bursts, HDR and animation are not preserved. No conversion API is used.',
  ],
  [
    'What happens to animations and multi-page TIFFs?',
    'GIF uses its first frame, and native animated formats use the browser’s default still frame. Every supported TIFF directory becomes a separate page, within the 50-page safety limit.',
  ],
  [
    'Does Pix2PDF compress my images?',
    'Standard and High create JPEGs at 85%/95% quality and cap the longest side at 2400/4096 pixels. Maximum keeps decoded resolution and PNG encoding, or embeds eligible JPEG data without recompression. Orientation and color decoding can still change the original representation. SVG is rasterized; this is not a vector-preserving or archival conversion.',
  ],
  [
    'Does it work offline?',
    'Conversion requires no server. Once the needed application and decoder bundles have loaded, you can convert without connectivity. First use of HEIC, TIFF, GIF or PDF generation may load a same-origin bundle. There is no service worker or guarantee of offline startup.',
  ],
  [
    'What happens to my images afterwards?',
    'They remain in this tab’s memory until you remove them, clear the session or leave the page. Refresh starts an empty workspace. The PDF you choose to download remains in your downloads folder. JavaScript cannot securely erase browser memory or control extensions and OS swap.',
  ],
];
export function Info() {
  return (
    <>
      <section className="section how" id="how-it-works">
        <div className="section-heading">
          <div>
            <span className="section-label">A LITTLE LESS FRICTION.</span>
            <h2>From pictures to pages.</h2>
          </div>
          <p>Three simple steps. Everything stays with you.</p>
        </div>
        <div className="steps">
          {[
            [
              '01',
              'Choose your images',
              'One photo or a collection. Drop them in and see every page.',
            ],
            [
              '02',
              'Make them yours',
              'Arrange, rotate and find the right fit. A4, Letter or your own image proportions.',
            ],
            [
              '03',
              'Download your PDF',
              'One tidy document, ready to share. Created right on your device.',
            ],
          ].map(([number, title, body]) => (
            <article key={number}>
              <span className="step-number">{number}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="privacy-panel section" id="privacy">
        <ShieldCheck className="privacy-icon" size={38} strokeWidth={1.3} />
        <div>
          <span className="section-label">YOUR IMAGES. YOUR BUSINESS.</span>
          <h2>Privacy is how it’s built.</h2>
          <p>
            No uploads, accounts or tracking. Your images are processed in
            browser memory and never stored by the app. Free to use, with no
            paid quotas.
          </p>
          <a
            href={`${SOURCE}/blob/master/PRIVACY.md`}
            target="_blank"
            rel="noreferrer"
          >
            Read the privacy architecture <ArrowUpRight size={15} />
          </a>
        </div>
        <div className="privacy-points">
          <span>
            <ShieldCheck size={18} />
            No conversion server
          </span>
          <span>
            <Layers3 size={18} />
            No image history
          </span>
          <span>
            <Code2 size={18} />
            Open for inspection
          </span>
        </div>
      </section>
      <section className="section formats" id="formats">
        <div>
          <span className="section-label">FAMILIAR FORMATS. ONE DOCUMENT.</span>
          <h2>Bring your images together.</h2>
        </div>
        <p>
          JPG · PNG · WebP · HEIC/HEIF · TIFF · GIF · BMP · SVG · ICO
          <br />
          <span>
            AVIF when your browser supports it. Static SVG only. GIF uses its
            first frame.
          </span>
        </p>
        <p className="limits-note">
          Safety limits: 50 pages, 40 MB per file, 200 MB input, 24 megapixels
          and 8192 px per side. Decoded images and PDF output are each capped at
          128 MB. Smaller batches work best on phones.
        </p>
      </section>
      <section className="faq section" id="faq">
        <div>
          <span className="section-label">A FEW THINGS TO KNOW</span>
          <h2>
            Good questions.
            <br />
            Clear answers.
          </h2>
          <p>
            Useful by design.
            <br />
            Honest about the details.
          </p>
          <a href={`${SOURCE}/issues`}>
            Something else? Open an issue <ArrowUpRight size={14} />
          </a>
        </div>
        <div className="faq-list">
          {faq.map(([question, answer]) => (
            <details key={question}>
              <summary>
                {question}
                <span aria-hidden="true">+</span>
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
      <div className="sibling-link">
        <span>Need the opposite?</span>
        <a
          href="https://lakshminarayanan2003.github.io/pdf-to-image/"
          target="_blank"
          rel="noreferrer"
        >
          PDF → PNG/JPG/WebP with PDF2Pix <ArrowUpRight size={15} />
        </a>
      </div>
      <footer>
        <a className="wordmark" href="#">
          <img
            src={`${import.meta.env.BASE_URL}favicon.svg`}
            width="28"
            height="28"
            alt=""
          />
          Pix2PDF
        </a>
        <span>Made for your images. Designed for your privacy.</span>
        <nav aria-label="Footer">
          <a href={SOURCE}>GitHub</a>
          <a href={`${SOURCE}/blob/master/LICENSE`}>MIT License</a>
          <a href={`${SOURCE}/blob/master/THIRD_PARTY_NOTICES.md`}>Notices</a>
          <a href={`${SOURCE}/blob/master/PRIVACY.md`}>Privacy</a>
          <a href={`${SOURCE}#readme`}>Docs</a>
        </nav>
        <small>v0.1.0 · Free & open source</small>
      </footer>
    </>
  );
}
