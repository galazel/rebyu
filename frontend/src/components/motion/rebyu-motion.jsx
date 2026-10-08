import { useEffect, useRef, useState } from "react"
import {
  AnimatePresence,
  animate,
  motion,
  useAnimationControls,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion"


export const EASE = [0.22, 1, 0.36, 1]

export const SPRING = { type: "spring", stiffness: 520, damping: 26, mass: 0.7 }


export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
}

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.35, ease: EASE } },
}

export const popIn = {
  hidden: { opacity: 0, scale: 0.94, y: 8 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.32, ease: [0.34, 1.56, 0.64, 1] } },
}

export function staggerParent(stagger = 0.07, delayChildren = 0) {
  return {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren } },
  }
}


export function Reveal({
  children,
  variants = fadeUp,
  delay = 0,
  once = true,
  amount = 0.15,
  as = "div",
  ...props
}) {
  const Component = motion[as] ?? motion.div

  return (
    <Component
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      variants={variants}
      transition={delay ? { delay } : undefined}
      {...props}
    >
      {children}
    </Component>
  )
}

export function StaggerList({
  children,
  stagger = 0.07,
  delayChildren = 0,
  once = true,
  amount = 0.1,
  as = "div",
  ...props
}) {
  const Component = motion[as] ?? motion.div

  return (
    <Component
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      variants={staggerParent(stagger, delayChildren)}
      {...props}
    >
      {children}
    </Component>
  )
}

export function StaggerItem({ children, variants = fadeUp, as = "div", ...props }) {
  const Component = motion[as] ?? motion.div

  return (
    <Component variants={variants} {...props}>
      {children}
    </Component>
  )
}

export function Collapse({ open, children, duration = 0.34 }) {
  const [animating, setAnimating] = useState(true)

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          key="collapse"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ height: { duration, ease: EASE }, opacity: { duration: duration * 0.6 } }}
          onAnimationStart={() => setAnimating(true)}
          onAnimationComplete={() => setAnimating(false)}
          style={{ overflow: animating ? "hidden" : "visible" }}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export function CountUp({ value, duration = 0.9, suffix = "", className }) {
  const reduced = useReducedMotion()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })

  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => Math.round(latest))

  useEffect(() => {
    if (!inView) return undefined
    if (reduced) {
      count.set(value)
      return undefined
    }

    const controls = animate(count, value, { duration, ease: EASE })
    return () => controls.stop()
  }, [inView, reduced, value, duration, count])

  return (
    <span ref={ref} className={className}>
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  )
}

export function TickPop({ done, children, className }) {
  return (
    <motion.span
      className={className}
      animate={done ? { scale: [1, 1.28, 1] } : { scale: 1 }}
      transition={done ? { duration: 0.42, ease: [0.34, 1.56, 0.64, 1] } : { duration: 0.2 }}
    >
      {children}
    </motion.span>
  )
}

export function useShake() {
  return {
    shake: { x: [0, -8, 8, -6, 6, -3, 3, 0], transition: { duration: 0.45 } },
    still: { x: 0 },
  }
}

export const HOVER_SPRING = { type: "spring", stiffness: 320, damping: 30, mass: 0.8 }

export function HoverLift({ children, lift = -6, scale = 1.015, as = "div", ...props }) {
  const Component = motion[as] ?? motion.div

  return (
    <Component
      whileHover={{ y: lift, scale }}
      whileTap={{ y: lift / 2, scale: 0.995 }}
      transition={HOVER_SPRING}
      {...props}
    >
      {children}
    </Component>
  )
}


export function Typewriter({
  text,
  as = "span",
  className,
  speed = 45,
  startDelay = 0.2,
  caret = true,
  startOnMount = false,
}) {
  const Component = motion[as] ?? motion.span
  const reduced = useReducedMotion()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const [typed, setTyped] = useState(0)

  const active = startOnMount || inView
  const done = typed >= text.length

  useEffect(() => {
    if (!active) return undefined
    if (reduced) {
      setTyped(text.length)
      return undefined
    }

    setTyped(0)
    let index = 0
    let ticker

    const opening = window.setTimeout(() => {
      ticker = window.setInterval(() => {
        index += 1
        setTyped(index)
        if (index >= text.length) window.clearInterval(ticker)
      }, speed)
    }, startDelay * 1000)

    return () => {
      window.clearTimeout(opening)
      window.clearInterval(ticker)
    }
  }, [active, reduced, text, speed, startDelay])

  return (
    <Component ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="relative inline-block max-w-full whitespace-pre-wrap">
        <span className="invisible">{text}</span>
        <span className="absolute inset-0">
          {text.slice(0, typed)}
          {caret && !reduced ? (
            <motion.span
              className="ml-0.5 inline-block w-[0.07em] self-stretch bg-current align-[-0.1em]"
              style={{ height: "1em" }}
              animate={done ? { opacity: 0 } : { opacity: [1, 1, 0, 0] }}
              transition={
                done
                  ? { duration: 0.4, delay: 0.9, ease: EASE }
                  : { duration: 0.9, repeat: Infinity, times: [0, 0.5, 0.5, 1] }
              }
            />
          ) : null}
        </span>
      </span>
    </Component>
  )
}

export function RotatingText({
  words,
  interval = 2400,
  className,
  itemClassName,
  travel = "0.55em",
}) {
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (reduced || words.length < 2) return undefined

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % words.length)
    }, interval)

    return () => window.clearInterval(timer)
  }, [reduced, words.length, interval])

  return (
    <span className={`inline-grid align-bottom ${className ?? ""}`}>
      {words.map((word) => (
        <span
          key={word}
          aria-hidden="true"
          className={`invisible col-start-1 row-start-1 ${itemClassName ?? ""}`}
        >
          {word}
        </span>
      ))}
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={words[index]}
          className={`col-start-1 row-start-1 ${itemClassName ?? ""}`}
          initial={{ opacity: 0, y: `-${travel}` }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: travel }}
          transition={{ duration: 0.32, ease: EASE }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

export function WordReveal({
  text,
  as = "span",
  className,
  wordClassName,
  stagger = 0.055,
  inherit = false,
  once = true,
}) {
  const Component = motion[as] ?? motion.span
  const words = text.split(" ")
  const ref = useRef(null)
  const inView = useInView(ref, { once, amount: 0.4 })
  const [rescued, setRescued] = useState(false)


  useEffect(() => {
    if (inherit) return undefined

    const timer = window.setTimeout(() => {
      const node = ref.current
      if (!node) return
      const box = node.getBoundingClientRect()
      if (box.top < window.innerHeight && box.bottom > 0) setRescued(true)
    }, 1400)

    return () => window.clearTimeout(timer)
  }, [inherit])

  const parent = staggerParent(stagger)
  const child = {
    hidden: { opacity: 0, y: "0.35em" },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
  }

  const driver = inherit
    ? {}
    : { initial: "hidden", animate: inView || rescued ? "show" : "hidden" }

  return (
    <Component ref={inherit ? undefined : ref} className={className} variants={parent} {...driver}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block whitespace-pre">
          <motion.span variants={child} className={`inline-block ${wordClassName ?? ""}`}>
            {word}
          </motion.span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </Component>
  )
}

export function HoverScale({ children, scale = 1.06, as = "span", className, ...props }) {
  const Component = motion[as] ?? motion.span

  return (
    <Component
      className={`inline-block ${className ?? ""}`}
      whileHover={{ scale }}
      whileTap={{ scale: 1 + (scale - 1) * 0.4 }}
      transition={HOVER_SPRING}
      {...props}
    >
      {children}
    </Component>
  )
}

export function useScrollSteps(ref, count, offset = ["start 72%", "end 62%"]) {
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset })
  const smoothed = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 })
  const fill = useTransform(smoothed, (value) =>
    reduced ? 1 : Math.min(1, Math.max(0, value)),
  )
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (reduced) {
      setActive(count)
      return undefined
    }

    const sync = (value) => {
      const next = Math.min(count, Math.max(0, Math.ceil(value * count)))
      setActive((current) => (current === next ? current : next))
    }

    sync(scrollYProgress.get())
    return scrollYProgress.on("change", sync)
  }, [scrollYProgress, count, reduced])

  return { fill, active }
}

export function useParallax(ref, distance = 60, offset = ["start end", "end start"]) {
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset })
  const smoothed = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 })
  const travel = reduced ? 0 : distance

  return useTransform(smoothed, [0, 1], [travel, -travel])
}

export { AnimatePresence, motion, useAnimationControls, useReducedMotion }
