'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })
let laptopAnimationData: unknown = null
let laptopAnimationPromise: Promise<unknown> | null = null

function loadLaptopAnimation() {
  if (laptopAnimationData) return Promise.resolve(laptopAnimationData)

  laptopAnimationPromise ??= fetch('/animations/laptop.json')
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      laptopAnimationData = data
      return data
    })
    .catch(() => null)

  return laptopAnimationPromise
}

interface LaptopFallbackImageProps {
  brand: string
  name: string
  className?: string
}

export function LaptopFallbackImage({ brand, name, className }: LaptopFallbackImageProps) {
  const [animationData, setAnimationData] = useState<unknown>(null)

  useEffect(() => {
    let cancelled = false

    loadLaptopAnimation().then((data) => {
      if (!cancelled) setAnimationData(data)
    })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div
      role="img"
      aria-label={`${brand} ${name} laptop illustration`}
      className={cn('laptop-fallback-art', className)}
    >
      {animationData ? (
        <Lottie
          animationData={animationData}
          loop={false}
          autoplay={false}
          rendererSettings={{
            preserveAspectRatio: 'xMidYMid meet',
            progressiveLoad: true,
          }}
          className="laptop-fallback-art__animation"
        />
      ) : (
        <div className="laptop-fallback-art__loading" />
      )}
    </div>
  )
}
