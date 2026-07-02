import { readFileSync } from 'node:fs'
import path from 'node:path'
import { LandingScrollLock } from '@/components/LandingScrollLock'
import { Laptop3D } from '@/components/Laptop3D'
import { LandingChat } from '@/components/LandingChat'
import { getServiceClient } from '@/lib/supabase'
import type { Laptop } from '@/types/laptop'

async function getLaptops(): Promise<Laptop[]> {
  try {
    const { data } = await getServiceClient()
      .from('laptops')
      .select('*')
      .eq('is_active', true)
      .order('price_inr', { ascending: true })
    return (data as Laptop[]) ?? []
  } catch {
    // Missing Supabase env (local builds) — chat still works via web search
    return []
  }
}

export async function ProvidedLandingPage() {
  const landingPath = path.join(process.cwd(), 'components/provided-landing')
  const html = readFileSync(path.join(landingPath, 'source.html'), 'utf8')
  const css = readFileSync(path.join(landingPath, 'source.css'), 'utf8')
  const laptops = await getLaptops()

  return (
    <>
      {/* start the 3D assets downloading with the HTML, in parallel with the JS bundles */}
      <link rel="preload" href="/models/macbook/mac-draco.glb" as="fetch" crossOrigin="anonymous" />
      <link rel="preload" href="/draco/draco_wasm_wrapper.js" as="fetch" crossOrigin="anonymous" />
      <link rel="preload" href="/draco/draco_decoder.wasm" as="fetch" crossOrigin="anonymous" />
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <Laptop3D />
      <LandingChat laptops={laptops} />
      <LandingScrollLock />
    </>
  )
}
