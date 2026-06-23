/**
 * Fix the seed file by properly adding image URLs to all rows
 * Handles the HP EliteBook 660 case where image URL was missing
 */

const fs = require('fs')
const path = require('path')

const INPUT_FILE = 'db-seed-31-laptops-final.sql'
const OUTPUT_FILE = 'db-seed-31-laptops-with-images.sql'

// Complete mapping with all 27 laptops
const IMAGES = {
  'Acer Aspire Lite AL15-41': 'https://m.media-amazon.com/images/I/51p3X7TlYHL._SX300_SY300_QL70_FMwebp_.jpg',
  'Lenovo IdeaPad Slim 3': 'https://m.media-amazon.com/images/I/41XEKV+zgoL._SX300_SY300_QL70_FMwebp_.jpg',
  'HP 15s (Core i3)': 'https://m.media-amazon.com/images/I/31lxEEzKVyL._SX300_SY300_QL70_FMwebp_.jpg',
  'Asus Vivobook Go 15': 'https://m.media-amazon.com/images/I/41ViRx7RBoL._SX300_SY300_QL70_FMwebp_.jpg',
  'Dell Inspiron 15 (Ryzen 5)': 'https://m.media-amazon.com/images/I/316eLOYJn1L._SX300_SY300_QL70_FMwebp_.jpg',
  'Lenovo LOQ 15IAX9': 'https://m.media-amazon.com/images/I/51EK03YgJoL._SX300_SY300_QL70_FMwebp_.jpg',
  'HP Victus 15 (RTX 5060)': 'https://m.media-amazon.com/images/I/41VhvGvVB8L._SX300_SY300_QL70_FMwebp_.jpg',
  'Acer Swift Go 14 AI': 'https://m.media-amazon.com/images/I/31nGvgsfcqL._SX300_SY300_QL70_FMwebp_.jpg',
  'Dell Inspiron 16 (RTX 4060)': 'https://m.media-amazon.com/images/I/41E5qwNmq5L._SX300_SY300_QL70_FMwebp_.jpg',
  'ASUS TUF Gaming A16 (2025)': 'https://m.media-amazon.com/images/I/41f9Z2NdaqL._SX300_SY300_QL70_FMwebp_.jpg',
  'HP Envy x360 14 (OLED)': 'https://m.media-amazon.com/images/I/41hMnJNfHZL._SX300_SY300_QL70_FMwebp_.jpg',
  'Asus Zenbook 14 (Intel Core Ultra)': 'https://m.media-amazon.com/images/I/51B8v0LKqQL._SX300_SY300_QL70_FMwebp_.jpg',
  'MacBook Air M4 (13-inch)': 'https://m.media-amazon.com/images/I/41xKwHlhVHL._SX300_SY300_QL70_FMwebp_.jpg',
  'MacBook Air M5 (15-inch)': 'https://m.media-amazon.com/images/I/41M8TYLq+2L._SX300_SY300_QL70_FMwebp_.jpg',
  'Alienware m16 R2 (RTX 4070)': 'https://m.media-amazon.com/images/I/41B3WCWC7FL._SX300_SY300_QL70_FMwebp_.jpg',
  'ASUS ROG Strix G16 (RTX 5070 Ti)': 'https://m.media-amazon.com/images/I/41J9d8GVDRL._SX300_SY300_QL70_FMwebp_.jpg',
  'Razer Blade 16 (RTX 5090)': 'https://m.media-amazon.com/images/I/41Xo3VYMz3L._SX300_SY300_QL70_FMwebp_.jpg',
  'Lenovo Yoga 9i (OLED)': 'https://m.media-amazon.com/images/I/41e4WRZvRXL._SX300_SY300_QL70_FMwebp_.jpg',
  'HP ZBook Firefly 14 G9': 'https://m.media-amazon.com/images/I/31s7V6H8dHL._SX300_SY300_QL70_FMwebp_.jpg',
  'Asus ProArt Studiobook 16': 'https://m.media-amazon.com/images/I/41oGmS8Uh8L._SX300_SY300_QL70_FMwebp_.jpg',
  'Lenovo ThinkPad X1 Carbon (Core Ultra)': 'https://m.media-amazon.com/images/I/41R9qLuUgLL._SX300_SY300_QL70_FMwebp_.jpg',
  'HP OmniBook 5 (Ryzen AI 350)': 'https://m.media-amazon.com/images/I/41pf+8xJSFL._SX300_SY300_QL70_FMwebp_.jpg',
  'Lenovo Yoga Slim 7 (Intel Core Ultra)': 'https://m.media-amazon.com/images/I/41e7KVNuX4L._SX300_SY300_QL70_FMwebp_.jpg',
  'HP Pavilion x360 14': 'https://m.media-amazon.com/images/I/41E5l5+L7UL._SX300_SY300_QL70_FMwebp_.jpg',
  'Asus VivoBook S14 (Core Ultra)': 'https://m.media-amazon.com/images/I/41H6v6NPVGL._SX300_SY300_QL70_FMwebp_.jpg',
  'Dell Inspiron 14 Plus (RTX 4050)': 'https://m.media-amazon.com/images/I/41j7N3bG0eL._SX300_SY300_QL70_FMwebp_.jpg',
  'Lenovo Legion 5 (RTX 4060)': 'https://m.media-amazon.com/images/I/41t3c1DHRIL._SX300_SY300_QL70_FMwebp_.jpg',
  'HP EliteBook 660 (Core Ultra)': 'https://m.media-amazon.com/images/I/41u5D+Gq4vL._SX300_SY300_QL70_FMwebp_.jpg',
}

console.log('📝 Fixing seed file with all image URLs...\n')

// Read original
let content = fs.readFileSync(INPUT_FILE, 'utf-8')

// Update INSERT statement
content = content.replace(
  'INSERT INTO laptops (name, brand, slug, price_inr, cpu_arch, cpu_brand, cpu_series, cpu_model, gpu_type, gpu_model, gpu_tgp_watts, ram_gb, ram_type, storage_gb, storage_type, display_size, display_type, display_hz, display_nits, display_color_gamut, battery_wh, weight_kg, os_support, best_for, pros, cons, affiliate_amazon_in)',
  'INSERT INTO laptops (name, brand, slug, price_inr, cpu_arch, cpu_brand, cpu_series, cpu_model, gpu_type, gpu_model, gpu_tgp_watts, ram_gb, ram_type, storage_gb, storage_type, display_size, display_type, display_hz, display_nits, display_color_gamut, battery_wh, weight_kg, os_support, best_for, pros, cons, affiliate_amazon_in, image_url)'
)

// Add image URLs
for (const [name, url] of Object.entries(IMAGES)) {
  const pattern = `('${name.replace(/'/g, "''").replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}',[^)]+\\))`
  const regex = new RegExp(`${pattern},`, 'g')

  // Find the line with this laptop
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`'${name}'`) && !lines[i].includes('m.media-amazon.com')) {
      // Replace the last single quote before ); with ', 'imageurl');
      lines[i] = lines[i].replace(/'https?:[^']*'\)(?!,)/g, (match) => {
        return `${match.slice(0, -2)}, '${url}')`
      })
      if (!lines[i].includes('m.media-amazon.com')) {
        // If still no image, add it before the closing );
        lines[i] = lines[i].replace(/\);$/, `, '${url}');`)
      }
    }
  }
  content = lines.join('\n')
}

// Verify
const imageCount = (content.match(/m\.media-amazon\.com/g) || []).length
console.log(`✅ Added ${imageCount} image URLs`)

// Save
fs.writeFileSync(OUTPUT_FILE, content)
console.log(`✅ Saved: ${OUTPUT_FILE}`)
console.log(`\n📋 Next: Paste the file into Supabase SQL Editor and run!`)
