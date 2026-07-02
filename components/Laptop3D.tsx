'use client'

import dynamic from 'next/dynamic'
import { createPortal } from 'react-dom'
import { useLandingSlot } from '@/components/useLandingSlot'

const Laptop3DScene = dynamic(() => import('./Laptop3DScene'), { ssr: false })

// Renders the WebGL laptop into the #laptop3d-slot placeholder that
// source.html leaves inside the sticky scroll section.
export function Laptop3D() {
  const slot = useLandingSlot('laptop3d-slot')

  if (!slot) return null
  return createPortal(<Laptop3DScene />, slot)
}
