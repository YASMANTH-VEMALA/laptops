# Skill: Laptop Researcher

Use this skill when researching, classifying, and adding laptops to the database.

## CPU Classification

### cpu_arch
- `ARM` — Apple M-series (M1, M2, M3, M4 and their Pro/Max/Ultra variants)
- `x86` — All Intel and AMD processors

### cpu_brand
- `Apple` / `Intel` / `AMD`

### cpu_series (critical — affects performance expectations)
| Series | TDP | Use Case | Notes |
|---|---|---|---|
| U | 15–28W | Thin & light, battery | Throttles under sustained load |
| P | 28–35W | Balanced performance | Mid-range thin laptops |
| H | 45W | Performance | Standard gaming/creator |
| HX | 55W+ | Extreme performance | Desktop-class in laptop |
| M-series | 10–60W | Apple Silicon | Efficiency + performance, ARM |

### cpu_brand + series combinations
- Intel Core Ultra 5/7/9 125H → brand: Intel, series: H
- Intel Core i5/i7/i9 13500H → brand: Intel, series: H
- AMD Ryzen 5/7/9 7745HX → brand: AMD, series: HX
- AMD Ryzen 5/7 7530U → brand: AMD, series: U
- Apple M3 / M3 Pro → brand: Apple, series: M-series

## GPU Classification

### gpu_type
- `integrated` — no dedicated GPU (Intel Iris Xe, AMD Radeon 780M, Apple GPU)
- `dedicated` — discrete GPU (NVIDIA RTX series, AMD RX series)

### gpu_tgp_watts (CRITICAL — same GPU model performs very differently at different wattage)
This is the most important spec for performance laptops. Always find the actual TGP:
- RTX 4060 laptop can be 60W (Max-Q, slow) or 80W (standard) or 115W (fast)
- RTX 4070 at 60W is SLOWER than RTX 4060 at 80W
- Find TGP on: notebookcheck.net, rtings.com, or the manufacturer's spec sheet
- If TGP is unknown, set to 0 and note "TGP unconfirmed"

### Common GPU TGP Ranges
| GPU | Typical TGP Range |
|---|---|
| RTX 4050 | 35–60W |
| RTX 4060 | 60–80W |
| RTX 4070 | 60–115W |
| RTX 4080 | 80–150W |
| RTX 4090 | 80–150W |

## Display Classification

### display_type
- `TN` — cheapest, poor colors, avoid for content work
- `IPS` — standard, good colors, 60–165Hz variants
- `OLED` — best contrast, perfect blacks, excellent color, watch for burn-in
- `Mini-LED` — bright, good HDR, no burn-in risk
- `AMOLED` — OLED variant on mobile/thin laptops

### display_nits thresholds
- < 250 nits — dim, bad outdoors
- 250–400 nits — standard, acceptable indoors
- 400–600 nits — bright, good outdoors
- > 600 nits — excellent, HDR capable

## RAM Classification
### ram_type
- `LPDDR5X` — fastest, soldered (common in thin laptops)
- `LPDDR5` — fast, soldered
- `DDR5` — fast, upgradeable slots
- `DDR4` — older, acceptable for budget

### Thresholds
- 8GB — minimum, will struggle with modern workloads
- 16GB — sweet spot for most use cases
- 32GB — required for AI/ML, heavy video editing
- 64GB+ — workstation class

## best_for Tag Assignment
Assign ALL applicable tags (this is an array field):

| Tag | Assign When |
|---|---|
| `gaming` | Dedicated GPU ≥ RTX 4060 60W, or AMD RX 7600M+ |
| `video-editing` | RAM ≥ 16GB AND (dedicated GPU OR Apple M-series Pro) |
| `programming` | Any CPU H-series or better, RAM ≥ 16GB |
| `general` | Any laptop — most laptops get this tag |
| `business` | Weight ≤ 1.6kg, battery ≥ 50Wh, display ≥ 300 nits |
| `ai-ml` | Dedicated GPU with VRAM ≥ 6GB OR Apple M3 Pro/Max |
| `design` | Display color gamut ≥ 90% DCI-P3 OR OLED display |
| `content` | Combination: good display + GPU + battery (creator machines) |
| `students` | Price ≤ ₹80k, battery ≥ 50Wh, weight ≤ 2kg |

## Slug Generation
Convert laptop name to URL-friendly slug:
- "Dell XPS 15 9530" → `dell-xps-15-9530`
- "Apple MacBook Air 15 M3" → `apple-macbook-air-15-m3`
- "ASUS ROG Zephyrus G14 2024" → `asus-rog-zephyrus-g14-2024`
Lowercase, replace spaces with hyphens, remove special chars.

## pros / cons Writing Guide
- pros: 2–3 sentences. Focus on what makes THIS laptop stand out vs alternatives at the price.
- cons: 1–2 sentences. Be honest. Mention TGP if it's limited, RAM if it's only 8GB, etc.
- Write for a non-technical reader but include one key spec in plain language.

Example pros: "Exceptional battery life (70Wh + ARM efficiency = 12–15 hours real-world). The M3 chip handles video exports faster than most Windows laptops at twice the price."
Example cons: "Only 8GB RAM soldered — can't upgrade. Heavy multitasking users should pay more for the 16GB variant."
