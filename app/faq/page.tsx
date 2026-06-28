import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { generateFAQSchema } from '@/lib/seo-helpers'

export const metadata: Metadata = {
  title: 'Laptop Buying Questions Answered - Laptick FAQ',
  description:
    'Common laptop buying questions answered for India. GPU TGP, Intel vs AMD, RAM, displays, gaming, coding, video editing, and budget advice.',
  keywords: ['laptop buying FAQ India', 'GPU TGP explained', 'how much RAM for programming', 'Intel vs AMD laptop'],
}

const FAQS = [
  {
    question: 'What is GPU TGP and why does it matter?',
    answer:
      'GPU TGP is the power budget a laptop gives to its graphics chip. The same RTX 4060 can perform very differently at 45W, 80W, or 140W, so TGP often matters as much as the GPU model name for gaming and rendering.',
  },
  {
    question: 'Should I buy an Intel or AMD laptop?',
    answer:
      'Both are good. Intel often makes sense for Quick Sync video workflows and broad compatibility. AMD Ryzen usually gives strong multi-core performance and battery value. Choose by use case, laptop cooling, and price instead of brand loyalty.',
  },
  {
    question: 'How much RAM do I need for programming?',
    answer:
      '16GB is the practical minimum for modern development. Choose 32GB if you use Docker, Android Studio, virtual machines, large IDE projects, or heavy browser multitasking. 64GB is mainly for ML, data, and workstation workloads.',
  },
  {
    question: 'Is 8GB RAM enough for students?',
    answer:
      '8GB can work for documents, browsing, classes, and light coding, but it feels tight on Windows with many tabs. If your budget allows, 16GB gives a much longer useful life.',
  },
  {
    question: 'What laptop specs matter most for gaming?',
    answer:
      'GPU model, GPU TGP, cooling design, display refresh rate, and 16GB RAM matter most. A higher-wattage RTX 4060 can beat a low-wattage GPU with a better name, so check the actual power limit.',
  },
  {
    question: 'Do I need a dedicated GPU for video editing?',
    answer:
      'For 1080p edits, integrated graphics can be acceptable. For 4K timelines, effects, color work, and faster exports in Premiere Pro or DaVinci Resolve, choose a dedicated NVIDIA GPU with enough VRAM.',
  },
  {
    question: 'What display specs matter for photo and video editing?',
    answer:
      'Look for strong color coverage, ideally 100% sRGB or high DCI-P3, plus good brightness. OLED and quality IPS displays are usually better choices than basic panels for creative work.',
  },
  {
    question: 'Is OLED better than IPS for laptops?',
    answer:
      'OLED gives excellent contrast and rich color, which is great for media and creative work. IPS can be safer for long static work sessions, often costs less, and avoids burn-in concerns.',
  },
  {
    question: 'How much should I spend on a student laptop in India?',
    answer:
      'Most students should target Rs. 50,000 to Rs. 80,000 for a balanced laptop with 16GB RAM, good battery life, and reliable build quality. Below Rs. 50,000 is workable for lighter use.',
  },
  {
    question: 'What is the best laptop budget for gaming in India?',
    answer:
      'The best value range is usually Rs. 80,000 to Rs. 1,20,000. That is where RTX 4050 and RTX 4060 laptops appear with enough performance for modern 1080p gaming.',
  },
  {
    question: 'Do developers need H-series CPUs?',
    answer:
      'H-series CPUs are better for compiling, containers, VMs, and heavy multitasking. U-series CPUs are better for battery life and light development. If you build large projects daily, H-series is worth it.',
  },
  {
    question: 'Is 32GB RAM worth it for coding?',
    answer:
      'It is worth it if you run Docker, local databases, Android Studio, VMs, or several projects at once. For basic web development, 16GB is still enough if the rest of the laptop is strong.',
  },
  {
    question: 'What storage should I choose?',
    answer:
      'Choose at least a 512GB NVMe SSD. Go for 1TB if you edit video, install large games, keep datasets, or use several development environments.',
  },
  {
    question: 'Does refresh rate matter if I do not game?',
    answer:
      'High refresh rate feels smoother for scrolling and UI movement, but it is not essential for office work, coding, or study. Gamers benefit from 120Hz, 144Hz, or higher the most.',
  },
  {
    question: 'Why can an expensive laptop feel slower than a cheaper one?',
    answer:
      'Thin premium laptops may limit power to control heat. A cheaper but thicker laptop with better cooling can sustain higher CPU or GPU performance for longer tasks.',
  },
  {
    question: 'Are MacBooks good for programming?',
    answer:
      'MacBooks are excellent for web, app, and general development because of battery life, trackpad quality, and performance consistency. Avoid them if your workflow needs Windows-only tools, upgradable hardware, or NVIDIA CUDA.',
  },
  {
    question: 'Do AI and machine learning students need NVIDIA graphics?',
    answer:
      'For local CUDA training, yes. NVIDIA GPUs are the safest choice for TensorFlow and PyTorch acceleration. For coursework, cloud notebooks may be enough, so do not overspend unless you train locally.',
  },
  {
    question: 'How important is laptop weight?',
    answer:
      'Weight matters if you carry the laptop daily. Under 1.5kg is comfortable, 1.5kg to 2kg is manageable, and gaming laptops above 2.3kg are better treated as portable desktops.',
  },
  {
    question: 'Should I buy based on brand?',
    answer:
      'Brand matters for support and build consistency, but the exact model matters more. Compare CPU, GPU power, thermals, display, RAM, storage, warranty, and price before deciding.',
  },
  {
    question: 'How does Laptick recommend laptops?',
    answer:
      'Laptick compares real specs against your use case, budget, and priorities. It explains tradeoffs like GPU wattage, CPU class, RAM, display quality, battery, and weight in plain English.',
  },
]

export default function FAQPage() {
  const faqSchema = generateFAQSchema(FAQS)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c') }}
      />
      <div className="laptick-themed-page">
        <div className="mx-auto max-w-4xl space-y-12 px-4 pb-16 pt-10 sm:px-6">
          <header className="space-y-5">
            <p className="themed-eyebrow">Laptop Buying FAQ</p>
            <h1 className="themed-heading">Laptop questions answered before you buy.</h1>
            <p className="themed-subtext" style={{ maxWidth: 760 }}>
              Clear answers for Indian buyers comparing specs, budgets, gaming performance, coding needs, and creator laptops.
            </p>
          </header>

          <section className="space-y-3">
            {FAQS.map((faq) => (
              <details key={faq.question} className="themed-dropdown">
                <summary className="themed-dropdown-summary">
                  <span className="themed-dropdown-summary-title">{faq.question}</span>
                  <span className="themed-dropdown-arrow">+</span>
                </summary>
                <div className="themed-dropdown-content">
                  <p className="themed-card-body pt-3">{faq.answer}</p>
                </div>
              </details>
            ))}
          </section>

          <section className="themed-card text-center" style={{ background: '#d9ff3f' }}>
            <h2 className="font-display text-3xl font-black text-foreground">Want the answer for your exact budget?</h2>
            <p className="themed-card-body mt-2">
              Answer a few questions and get laptop picks with the same spec explanations applied to real models.
            </p>
            <Link href="/find-my-laptop" className="themed-primary-action mt-4" style={{ background: 'hsl(0 0% 2%)', color: '#d9ff3f' }}>
              Find My Laptop <ArrowRight className="inline h-4 w-4" />
            </Link>
          </section>
        </div>
      </div>
    </>
  )
}
