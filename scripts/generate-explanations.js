#!/usr/bin/env node

/**
 * Pre-generate laptop explanations for all laptop + use-case combinations
 * Run with: node scripts/generate-explanations.js
 *
 * This script:
 * 1. Fetches all active laptops from Supabase
 * 2. For each laptop and each use-case, generates a detailed explanation using Claude
 * 3. Stores explanations in the laptop_explanations table
 * 4. Skips if explanation already cached (unless --force flag is used)
 */

// Load .env.local before anything else
const path = require('path');
const fs = require('fs');
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
  });
}

const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mvnbzcxgbltzkxodxicr.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12bmJ6Y3hnYmx0emt4b2R4aWNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzIyNjYyNywiZXhwIjoyMDcyODAyNjI3fQ.xtyROStQlpPwPH4KyvH7lvdDfCKbXjsie9yn_AmGlLE';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const USE_CASES = ['gaming', 'programming', 'video-editing', 'design', 'ai-ml', 'general', 'business', 'content'];
const FORCE_REGENERATE = process.argv.includes('--force');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are India's top laptop hardware expert. You write recommendation explanations that make users feel deeply informed and confident — like a knowledgeable friend explaining exactly what they're getting and WHY it matters for their life.

RULES FOR EXPLANATION QUALITY:

1. ALWAYS explain the WHY behind every spec, not just the what:
   BAD: "Intel Core i7-13700H processor"
   GOOD: "Intel Core i7-13700H has 6 Performance cores + 8 Efficiency cores — the P-cores handle your game or code full-power, while E-cores run Discord, Spotify, browser tabs silently in background. This is why it never stutters even when multitasking heavily."

2. Use real-world numbers and comparisons:
   BAD: "144Hz display for smooth gaming"
   GOOD: "144Hz means 144 screen refreshes per second — your phone does 60Hz. At 144Hz, fast movement appears sharper and you react faster. It's genuinely the difference between winning and losing in competitive games."

3. Explain GPU TGP in every gaming/creative recommendation:
   BAD: "RTX 4060 GPU"
   GOOD: "RTX 4060 at 80W TGP (not the stripped-down 45W version in thin laptops) — all 3,072 CUDA cores run at full power. In Valorant you'll hit 140+ FPS. In GTA V at ultra, expect 65-80 FPS with zero throttling."

4. Explain CPU cores in practical terms:
   4 cores: handles office, browsing, video calls
   6-8 cores: smooth for coding, light gaming, content creation
   10-14 cores: fast compilation, no CPU bottleneck in games
   16+ cores: professional AI/ML, heavy video production

5. Explain RAM in daily life terms:
   8GB: Chrome + one app. Too tight for 2025.
   16GB: Chrome (10 tabs) + VS Code + Discord + Spotify. Comfortable.
   32GB: Data science, multiple VMs, 4K editing without lag.
   64GB: Serious AI/ML training, enterprise workloads.

6. Be honest about India-specific context:
   - Battery enough for a college day without charger?
   - Display bright enough for Indian offices/classrooms?
   - Weight reasonable for daily commute?

7. For weaknesses — be genuinely specific:
   BAD: "Limited battery life"
   GOOD: "Battery lasts 4-5 hours under gaming load — you will need the charger for long sessions. The 230W adapter is heavy and not ideal for daily commuting."

Return ONLY valid JSON:
{
  "explanation": "4-5 sentences using specific specs + real-world impact. Explain WHY specs matter for THIS use case. Include at least one number comparison.",
  "key_strengths": [
    "Specific strength with WHY it matters (not generic)",
    "Specific strength with real-world impact example",
    "Specific strength with comparison to what user would have had otherwise"
  ],
  "one_weakness": "ONE weakness SPECIFIC to THIS exact laptop for THIS use case. NOT a generic statement that applies to 20 other laptops. Good weaknesses: a specific Hz/nits/weight number that is lower than alternatives, a soldered RAM limitation, a missing port, a known throttling issue at this TGP, a display panel choice. BAD weaknesses: 'integrated GPU' (too generic), 'limited battery' (too generic), 'not for gaming' on a business laptop (obvious)."
}`;

function buildExplanationPrompt(laptop, useCase) {
  const useCaseContext = {
    gaming: `For gaming, prioritize:
- GPU TGP (Total Graphics Power) — higher TGP = sustained performance without throttling
- Display refresh rate — 144Hz+ for competitive gaming
- CPU cooling — must handle sustained loads without thermal throttling
- RAM — 16GB minimum for modern AAA games

This ${laptop.name} has:
- GPU: ${laptop.gpu_model} @ ${laptop.gpu_tgp_watts}W TGP
- Display: ${laptop.display_hz}Hz ${laptop.display_type}
- CPU: ${laptop.cpu_brand} ${laptop.cpu_model}
- RAM: ${laptop.ram_gb}GB
- Price: ₹${laptop.price_inr.toLocaleString()}`,

    programming: `For programming, prioritize:
- CPU cores — more cores = faster compilation and build times
- RAM — 16GB+ for large projects and Docker containers
- SSD speed — fast I/O matters for large codebases and package management
- Keyboard quality — must be comfortable for 8+ hours of typing

This ${laptop.name} has:
- CPU: ${laptop.cpu_brand} ${laptop.cpu_model} (${laptop.cpu_series}-series)
- RAM: ${laptop.ram_gb}GB
- Storage: ${laptop.storage_gb}GB ${laptop.storage_type}
- Display: ${laptop.display_size}" ${laptop.display_type}
- Price: ₹${laptop.price_inr.toLocaleString()}`,

    'video-editing': `For video editing, prioritize:
- GPU VRAM and TGP — 4GB+ VRAM with sufficient power for real-time effects
- RAM — 32GB minimum for smooth 4K editing
- CPU cores — 8+ cores for multi-threaded rendering
- Display color accuracy — important for color grading

This ${laptop.name} has:
- GPU: ${laptop.gpu_model} @ ${laptop.gpu_tgp_watts}W TGP
- RAM: ${laptop.ram_gb}GB
- CPU: ${laptop.cpu_brand} ${laptop.cpu_model}
- Storage: ${laptop.storage_gb}GB ${laptop.storage_type}
- Display: ${laptop.display_size}" ${laptop.display_type}, ${laptop.display_nits} nits
- Price: ₹${laptop.price_inr.toLocaleString()}`,

    design: `For graphic design and creative work, prioritize:
- Display color accuracy — DCI-P3 95%+ or Adobe RGB coverage essential
- Display brightness — 300+ nits for bright room usage
- GPU acceleration — for smooth Photoshop and Figma performance
- RAM — 16GB+ for large design files and multiple apps

This ${laptop.name} has:
- Display: ${laptop.display_size}" ${laptop.display_type}, ${laptop.display_nits} nits, ${laptop.display_color_gamut ? laptop.display_color_gamut + '% DCI-P3' : 'color gamut unknown'}
- GPU: ${laptop.gpu_model} @ ${laptop.gpu_tgp_watts}W TGP
- RAM: ${laptop.ram_gb}GB
- CPU: ${laptop.cpu_brand} ${laptop.cpu_model}
- Price: ₹${laptop.price_inr.toLocaleString()}`,

    'ai-ml': `For AI/ML development, prioritize:
- GPU VRAM — 8GB+ for training large models (hard constraint)
- System RAM — 32GB+ for data preprocessing and model evaluation
- CUDA cores — for GPU-accelerated training
- CPU cores — helps with data loading and preprocessing

This ${laptop.name} has:
- GPU: ${laptop.gpu_model} @ ${laptop.gpu_tgp_watts}W TGP (VRAM unknown, verify separately)
- System RAM: ${laptop.ram_gb}GB
- CPU: ${laptop.cpu_brand} ${laptop.cpu_model}
- Storage: ${laptop.storage_gb}GB ${laptop.storage_type}
- Price: ₹${laptop.price_inr.toLocaleString()}`,

    general: `For general everyday use, prioritize:
- Battery life — 8+ hours of real-world usage
- Weight — under 1.8kg for portability
- CPU efficiency — ARM processors (Apple Silicon) excel here
- Display brightness — 300+ nits for outdoor usage

This ${laptop.name} has:
- CPU: ${laptop.cpu_brand} ${laptop.cpu_model} (${laptop.cpu_arch})
- Battery: ${laptop.battery_wh}Wh (estimated ${Math.round(laptop.battery_wh / 10)}-12 hours)
- Weight: ${laptop.weight_kg}kg
- Display: ${laptop.display_size}" ${laptop.display_type}, ${laptop.display_nits} nits
- Price: ₹${laptop.price_inr.toLocaleString()}`,

    business: `For business professionals, prioritize:
- Build quality — solid aluminum chassis that survives bag tossing
- Keyboard — must be comfortable for all-day typing
- Display brightness — 400+ nits for video calls in bright rooms
- Webcam quality — 1080p minimum for professional video calls

This ${laptop.name} has:
- Build quality: ${laptop.brand} typically uses ${laptop.cpu_arch === 'ARM' ? 'premium aluminum' : 'mixed materials'}
- Display: ${laptop.display_size}" ${laptop.display_type}, ${laptop.display_nits} nits
- Weight: ${laptop.weight_kg}kg
- CPU: ${laptop.cpu_brand} ${laptop.cpu_model}
- Price: ₹${laptop.price_inr.toLocaleString()}`,

    content: `For content creation (YouTubers, podcasters, streamers), prioritize:
- Balanced GPU and CPU — need both for rendering and streaming simultaneously
- RAM — 16GB+ for background processes while recording
- Display — good color accuracy for thumbnail editing and video review
- Audio quality — clear microphone and speaker for recording

This ${laptop.name} has:
- GPU: ${laptop.gpu_model} @ ${laptop.gpu_tgp_watts}W TGP
- CPU: ${laptop.cpu_brand} ${laptop.cpu_model}
- RAM: ${laptop.ram_gb}GB
- Display: ${laptop.display_size}" ${laptop.display_type}, ${laptop.display_nits} nits
- Battery: ${laptop.battery_wh}Wh
- Price: ₹${laptop.price_inr.toLocaleString()}`,
  };

  return `Generate a detailed explanation for why the ${laptop.name} is relevant for ${useCase}.

${useCaseContext[useCase] || useCaseContext['general']}

Focus on:
1. How this specific laptop's specs match the ${useCase} use case
2. Real performance expectations (don't oversell)
3. What makes it better than cheaper alternatives
4. What limitations exist (be honest)

Make the explanation confident and detailed — the goal is to build trust by showing you understand both the specs AND why they matter for this person's workflow.`;
}

async function generateExplanation(laptop, useCase) {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1200,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: buildExplanationPrompt(laptop, useCase),
      },
    ],
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text : '';
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const jsonText = fenceMatch ? fenceMatch[1].trim() : raw.trim();

  try {
    return JSON.parse(jsonText);
  } catch (err) {
    console.error(`[${laptop.id}/${useCase}] JSON parse failed. Raw response:`, raw.substring(0, 300));
    throw err;
  }
}

async function main() {
  console.log('📚 Fetching active laptops from Supabase...');
  const { data: laptops, error: laptopsError } = await supabase
    .from('laptops')
    .select('*')
    .eq('is_active', true);

  if (laptopsError || !laptops) {
    console.error('❌ Error fetching laptops:', laptopsError);
    process.exit(1);
  }

  console.log(`✅ Found ${laptops.length} active laptops\n`);

  if (!FORCE_REGENERATE) {
    console.log('🔍 Checking for existing explanations...');
    const { data: existing } = await supabase
      .from('laptop_explanations')
      .select('laptop_id,use_case');

    const existingSet = new Set((existing || []).map((e) => `${e.laptop_id}/${e.use_case}`));
    console.log(`ℹ️  ${existingSet.size} explanations already cached (use --force to regenerate)\n`);
  }

  let totalGenerated = 0;
  let totalSkipped = 0;

  for (const laptop of laptops) {
    console.log(`\n🚀 Processing: ${laptop.name} (₹${laptop.price_inr.toLocaleString()})`);

    for (const useCase of USE_CASES) {
      const cacheKey = `${laptop.id}/${useCase}`;

      if (!FORCE_REGENERATE) {
        const { data: existing } = await supabase
          .from('laptop_explanations')
          .select('id')
          .eq('laptop_id', laptop.id)
          .eq('use_case', useCase)
          .single();

        if (existing) {
          console.log(`  ⏭️  ${useCase} (already cached)`);
          totalSkipped++;
          continue;
        }
      }

      try {
        console.log(`  ⏳ Generating ${useCase}...`);
        const explanation = await generateExplanation(laptop, useCase);

        const { error: insertError } = await supabase
          .from('laptop_explanations')
          .upsert(
            {
              laptop_id: laptop.id,
              use_case: useCase,
              explanation: explanation.explanation,
              key_strengths: explanation.key_strengths,
              one_weakness: explanation.one_weakness,
              cached_at: new Date().toISOString(),
            },
            {
              onConflict: 'laptop_id,use_case',
            }
          );

        if (insertError) {
          console.error(`  ❌ Insert error for ${useCase}:`, insertError.message);
        } else {
          console.log(`  ✅ ${useCase}`);
          totalGenerated++;
        }

        // Rate limit: 50 requests per minute
        await new Promise((resolve) => setTimeout(resolve, 1200));
      } catch (err) {
        console.error(`  ❌ Error generating ${useCase}:`, err.message);
      }
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Generated: ${totalGenerated}`);
  console.log(`   Skipped: ${totalSkipped}`);
  console.log(`   Total: ${totalGenerated + totalSkipped}`);
  console.log(`\n✨ Done!`);
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
