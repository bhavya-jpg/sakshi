"use client"
import { useEffect, useRef, type ElementType, type ReactNode, type CSSProperties } from "react"

/** Sets data-shown="true" once the element scrolls into view (once). Pair with .reveal or .draw. */
export function Reveal({ as: Tag = "div", className = "", style, children, delay = 0 }: {
  as?: ElementType; className?: string; style?: CSSProperties; children: ReactNode; delay?: number
}) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === "undefined") { el.dataset.shown = "true"; return }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.dataset.shown = "true"; io.disconnect() }
    }, { rootMargin: "0px 0px -12% 0px" })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return <Tag ref={ref} className={className} style={{ transitionDelay: `${delay}ms`, ...style }}>{children}</Tag>
}
