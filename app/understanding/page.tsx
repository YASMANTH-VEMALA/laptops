import type { Metadata } from 'next'
import Link from 'next/link'
import { readFileSync } from 'node:fs'
import path from 'node:path'

export const metadata: Metadata = {
  title: 'Understanding Laptop Hardware - Laptick',
  description: 'Learn about CPU, GPU, RAM, SSD, Displays, and Battery specs simply explained.',
}

export default function UnderstandingPage() {
  const landingPath = path.join(process.cwd(), 'components/provided-landing')
  const css = readFileSync(path.join(landingPath, 'source.css'), 'utf8')

  return (
    <div className="exact-animation-home">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="laptick-normal-site" style={{ minHeight: 'auto', paddingTop: '2.5rem', paddingBottom: '5rem' }}>
        <div className="education-section" style={{ borderTop: 'none', paddingBlock: '0' }}>
          <div className="education-header">
            <h1 className="garamond-header text-5xl font-extrabold text-center mb-4" style={{ fontFamily: '"EB Garamond", serif', fontSize: 'clamp(2.5rem, 6vw, 3.5rem)' }}>
              Understanding Laptop Hardware
            </h1>
            <p className="education-intro">
              Modern laptops are complex systems where every component affects every other. A fast CPU with insufficient RAM still feels slow. A powerful GPU without proper cooling performs worse.
            </p>
          </div>

          <div className="education-grid">
            {/* CPU Section */}
            <article className="edu-card edu-cpu">
              <div className="edu-line-top"></div>
              <h4>CPU (Processor)</h4>
              <p className="edu-subtitle">The brain of your laptop</p>

              <div className="edu-content">
                <h5>What Does It Do?</h5>
                <ul>
                  <li>Executes instructions</li>
                  <li>Performs calculations</li>
                  <li>Manages system operations</li>
                  <li>Runs all your applications</li>
                </ul>

                <h5 style={{ marginTop: '1.2rem' }}>x86 Architecture</h5>
                <p style={{ fontSize: '0.9rem', color: '#555' }}>Intel & AMD · Better for gaming, development, professional software</p>

                <h5 style={{ marginTop: '1rem' }}>ARM Architecture</h5>
                <p style={{ fontSize: '0.9rem', color: '#555' }}>Apple Silicon, Snapdragon · Better for battery life, portability, students</p>
              </div>
            </article>

            {/* GPU Section */}
            <article className="edu-card edu-gpu">
              <div className="edu-line-top"></div>
              <h4>GPU (Graphics)</h4>
              <p className="edu-subtitle">Handles visual processing</p>

              <div className="edu-content">
                <h5>What It Powers</h5>
                <ul>
                  <li>Gaming performance</li>
                  <li>Video editing & rendering</li>
                  <li>AI/ML training</li>
                  <li>3D design & CAD</li>
                </ul>

                <h5 style={{ marginTop: '1.2rem' }}>Key Specs</h5>
                <ul style={{ fontSize: '0.9rem' }}>
                  <li><strong>VRAM:</strong> 2GB–24GB (more needed for AI/professional work)</li>
                  <li><strong>TGP:</strong> 20W–150W (power budget)</li>
                  <li><strong>Cores:</strong> More = better multitasking</li>
                </ul>
              </div>
            </article>

            {/* RAM Section */}
            <article className="edu-card edu-ram">
              <div className="edu-line-top"></div>
              <h4>RAM (Memory)</h4>
              <p className="edu-subtitle">Your active workspace</p>

              <div className="edu-content">
                <h5>How Much You Need</h5>
                <ul>
                  <li><strong>8GB:</strong> Basic browsing, light work</li>
                  <li><strong>16GB:</strong> Most users, coding, content creation</li>
                  <li><strong>32GB+:</strong> AI/ML, video editing, heavy multitasking</li>
                </ul>

                <h5 style={{ marginTop: '1.2rem' }}>Speed Matters</h5>
                <p style={{ fontSize: '0.9rem' }}>Faster RAM (DDR5 &gt; DDR4) helps with responsiveness and multitasking.</p>
              </div>
            </article>

            {/* Storage Section */}
            <article className="edu-card edu-storage">
              <div className="edu-line-top"></div>
              <h4>Storage (SSD)</h4>
              <p className="edu-subtitle">Fast access to your files</p>

              <div className="edu-content">
                <h5>Capacity vs Speed</h5>
                <ul>
                  <li><strong>256GB–512GB:</strong> Budget laptops, basic use</li>
                  <li><strong>512GB–1TB:</strong> Recommended for most</li>
                  <li><strong>1TB+:</strong> Creators, developers, large projects</li>
                </ul>

                <h5 style={{ marginTop: '1.2rem' }}>Speed Specs</h5>
                <p style={{ fontSize: '0.9rem' }}><strong>NVMe Gen4 (7000 MB/s)</strong> feels snappier than Gen3 (3500 MB/s)</p>
              </div>
            </article>

            {/* Display Section */}
            <article className="edu-card edu-display">
              <div className="edu-line-top"></div>
              <h4>Display</h4>
              <p className="edu-subtitle">What you see matters</p>

              <div className="edu-content">
                <h5>Key Specs</h5>
                <ul>
                  <li><strong>Resolution:</strong> 1080p, 1440p, 4K (sharpness)</li>
                  <li><strong>Refresh Rate:</strong> 60Hz, 120Hz, 144Hz (smoothness)</li>
                  <li><strong>Color Accuracy:</strong> sRGB, DCI-P3 (for design/video)</li>
                  <li><strong>Brightness:</strong> 300+ nits (outdoor visibility)</li>
                </ul>

                <h5 style={{ marginTop: '1.2rem' }}>Best For</h5>
                <p style={{ fontSize: '0.9rem' }}>Creators need 100% sRGB. Gamers want 144Hz+. Students just need clear text.</p>
              </div>
            </article>

            {/* Battery Section */}
            <article className="edu-card edu-battery">
              <div className="edu-line-top"></div>
              <h4>Battery</h4>
              <p className="edu-subtitle">How long it lasts matters</p>

              <div className="edu-content">
                <h5>What Affects Battery Life</h5>
                <ul>
                  <li><strong>Capacity (Wh):</strong> Higher = longer runtime</li>
                  <li><strong>CPU efficiency:</strong> ARM &gt;&gt; x86 for battery</li>
                  <li><strong>Display:</strong> Brightness &amp; resolution drain fast</li>
                  <li><strong>GPU:</strong> Gaming/rendering kills battery</li>
                </ul>

                <h5 style={{ marginTop: '1.2rem' }}>Real-World Impact</h5>
                <p style={{ fontSize: '0.9rem' }}>Expect 8–12 hours light work. Gaming: 2–4 hours.</p>
              </div>
            </article>
          </div>

          <div className="education-footer" style={{ marginTop: '4rem' }}>
            <p><strong>The Key Insight:</strong> Don\'t optimize for one component alone. A perfect CPU means nothing without enough RAM. A beautiful display kills battery life. <strong>The best laptop balances all five.</strong></p>
            <Link href="/laptops" className="primary-action">Find Yours Now</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
