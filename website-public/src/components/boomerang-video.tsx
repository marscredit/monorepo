"use client"

interface BoomerangVideoProps {
  src: string
  className?: string
  opacity?: number
}

export function BoomerangVideo({ src, className = "", opacity = 0.5 }: BoomerangVideoProps) {
  return (
    <video
      autoPlay
      loop
      muted
      playsInline
      className={className}
      style={{ 
        opacity,
        objectFit: 'cover',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    >
      <source src={src} type="video/mp4" />
    </video>
  )
}

