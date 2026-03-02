import { useEffect } from 'react';
import { motion, useAnimation } from 'motion/react';

function useControlled(animate) {
  const controls = useAnimation();
  useEffect(() => {
    if (animate) controls.start('animate');
    else controls.start('initial');
  }, [animate, controls]);
  return controls;
}

const svgProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

// ─── Settings (gear rotation) ───────────────────────────────────────
export function AnimatedSettings({ size = 18, animate }) {
  const c = useControlled(animate);
  return (
    <motion.svg {...svgProps} width={size} height={size} viewBox="0 0 24 24">
      <motion.g variants={{ initial: { rotate: 0 }, animate: { rotate: 180, transition: { duration: 0.5, ease: 'easeInOut' } } }} initial="initial" animate={c}>
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx={12} cy={12} r={3} />
      </motion.g>
    </motion.svg>
  );
}

// ─── LayoutDashboard (panels morph) ─────────────────────────────────
export function AnimatedLayoutDashboard({ size = 18, animate }) {
  const c = useControlled(animate);
  const v = (initial, anim) => ({ initial, animate: { ...anim, transition: { duration: 0.3, ease: 'easeInOut' } } });
  return (
    <motion.svg {...svgProps} width={size} height={size} viewBox="0 0 24 24">
      <motion.rect width={7} height={9} x={3} y={3} rx={1} ry={1} variants={v({ height: 9 }, { height: 5 })} initial="initial" animate={c} />
      <motion.rect width={7} height={5} x={14} y={3} rx={1} ry={1} variants={v({ height: 5 }, { height: 9 })} initial="initial" animate={c} />
      <motion.rect width={7} height={9} x={14} y={12} rx={1} ry={1} variants={v({ height: 9, y: 0 }, { height: 5, y: 4 })} initial="initial" animate={c} />
      <motion.rect width={7} height={5} x={3} y={16} rx={1} ry={1} variants={v({ height: 5, y: 0 }, { height: 9, y: -4 })} initial="initial" animate={c} />
    </motion.svg>
  );
}

// ─── Kanban (bars shuffle) ──────────────────────────────────────────
export function AnimatedKanban({ size = 18, animate }) {
  const c = useControlled(animate);
  return (
    <motion.svg {...svgProps} width={size} height={size} viewBox="0 0 24 24">
      <motion.line x1={6} y1={5} x2={6} y2={16} variants={{ initial: { y2: 16 }, animate: { y2: [16, 19, 11, 16], transition: { duration: 0.6, ease: 'linear' } } }} initial="initial" animate={c} />
      <motion.line x1={12} y1={5} x2={12} y2={11} variants={{ initial: { y2: 11 }, animate: { y2: [11, 16, 19, 11], transition: { duration: 0.6, ease: 'linear' } } }} initial="initial" animate={c} />
      <motion.line x1={18} y1={5} x2={18} y2={19} variants={{ initial: { y2: 19 }, animate: { y2: [19, 11, 16, 19], transition: { duration: 0.6, ease: 'linear' } } }} initial="initial" animate={c} />
    </motion.svg>
  );
}

// ─── MessageCircle (wobble) ─────────────────────────────────────────
export function AnimatedMessageCircle({ size = 18, animate }) {
  const c = useControlled(animate);
  return (
    <motion.svg {...svgProps} width={size} height={size} viewBox="0 0 24 24">
      <motion.path
        d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"
        variants={{
          initial: { rotate: 0 },
          animate: { transformOrigin: 'bottom left', rotate: [0, 8, -8, 2, 0], transition: { ease: 'easeInOut', duration: 0.8, times: [0, 0.4, 0.6, 0.8, 1] } },
        }}
        initial="initial"
        animate={c}
      />
    </motion.svg>
  );
}

// ─── ChartColumnIncreasing (bars draw) ──────────────────────────────
export function AnimatedBarChart({ size = 18, animate }) {
  const c = useControlled(animate);
  const bar = (i) => ({
    initial: { opacity: 1 },
    animate: { opacity: [0, 1], pathLength: [0, 1], transition: { ease: 'easeInOut', duration: 0.4, delay: i * 0.15 } },
  });
  return (
    <motion.svg {...svgProps} width={size} height={size} viewBox="0 0 24 24">
      <motion.path d="M8 17V13" variants={bar(0)} initial="initial" animate={c} />
      <motion.path d="M13 17V9" variants={bar(1)} initial="initial" animate={c} />
      <motion.path d="M18 17V5" variants={bar(2)} initial="initial" animate={c} />
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
    </motion.svg>
  );
}

// ─── Activity (pulse draw) ──────────────────────────────────────────
export function AnimatedActivity({ size = 18, animate }) {
  const c = useControlled(animate);
  return (
    <motion.svg {...svgProps} width={size} height={size} viewBox="0 0 24 24">
      <motion.path
        d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"
        variants={{
          initial: { opacity: 1, pathLength: 1, pathOffset: 0 },
          animate: { opacity: [0, 1], pathLength: [0, 1], pathOffset: [1, 0], transition: { duration: 0.8, ease: 'easeInOut', opacity: { duration: 0.01 } } },
        }}
        initial="initial"
        animate={c}
      />
    </motion.svg>
  );
}

// ─── CalendarDays (custom bounce + dots pulse) ──────────────────────
export function AnimatedCalendarDays({ size = 18, animate }) {
  const c = useControlled(animate);
  return (
    <motion.svg {...svgProps} width={size} height={size} viewBox="0 0 24 24">
      <motion.g variants={{ initial: { y: 0 }, animate: { y: [0, -2, 0], transition: { duration: 0.4, ease: 'easeInOut' } } }} initial="initial" animate={c}>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect width={18} height={18} x={3} y={4} rx={2} />
        <path d="M3 10h18" />
        <motion.g variants={{ initial: { scale: 1, opacity: 1 }, animate: { scale: [1, 1.3, 1], opacity: [1, 0.6, 1], transition: { duration: 0.5, ease: 'easeInOut', delay: 0.15 } } }} initial="initial" animate={c}>
          <path d="M8 14h.01" />
          <path d="M12 14h.01" />
          <path d="M16 14h.01" />
          <path d="M8 18h.01" />
          <path d="M12 18h.01" />
          <path d="M16 18h.01" />
        </motion.g>
      </motion.g>
    </motion.svg>
  );
}
