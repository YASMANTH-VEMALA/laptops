import { readFileSync } from 'node:fs'
import path from 'node:path'
import { LandingScrollLock } from '@/components/LandingScrollLock'

export function ProvidedLandingPage() {
  const landingPath = path.join(process.cwd(), 'components/provided-landing')
  const html = readFileSync(path.join(landingPath, 'source.html'), 'utf8')
  const css = readFileSync(path.join(landingPath, 'source.css'), 'utf8')

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <LandingScrollLock />
    </>
  )
}
