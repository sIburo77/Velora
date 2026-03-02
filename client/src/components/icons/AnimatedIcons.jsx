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

// ─── Sun (rays draw sequentially) ───────────────────────────────────
export function AnimatedSun({ size = 16, animate }) {
  const c = useControlled(animate);
  const ray = (i) => ({
    initial: { opacity: 1, scale: 1 },
    animate: { opacity: [0, 1], pathLength: [0, 1], transition: { duration: 0.6, ease: 'easeInOut', delay: i * 0.08 } },
  });
  return (
    <motion.svg {...svgProps} width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" />
      <motion.line x1="12" y1="4" x2="12" y2="2" variants={ray(0)} initial="initial" animate={c} />
      <motion.line x1="17.7" y1="6.3" x2="19.1" y2="4.9" variants={ray(1)} initial="initial" animate={c} />
      <motion.line x1="20" y1="12" x2="22" y2="12" variants={ray(2)} initial="initial" animate={c} />
      <motion.line x1="17.7" y1="17.7" x2="19.1" y2="19.1" variants={ray(3)} initial="initial" animate={c} />
      <motion.line x1="12" y1="20" x2="12" y2="22" variants={ray(4)} initial="initial" animate={c} />
      <motion.line x1="6.3" y1="17.7" x2="4.9" y2="19.1" variants={ray(5)} initial="initial" animate={c} />
      <motion.line x1="4" y1="12" x2="2" y2="12" variants={ray(6)} initial="initial" animate={c} />
      <motion.line x1="6.3" y1="6.3" x2="4.9" y2="4.9" variants={ray(7)} initial="initial" animate={c} />
    </motion.svg>
  );
}

// ─── Moon (wobble rotation) ─────────────────────────────────────────
export function AnimatedMoon({ size = 16, animate }) {
  const c = useControlled(animate);
  return (
    <motion.svg {...svgProps} width={size} height={size} viewBox="0 0 24 24">
      <motion.path
        d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"
        variants={{
          initial: { rotate: 0, transition: { duration: 0.5, ease: 'easeInOut' } },
          animate: { rotate: [0, -30, 25, -15, 10, -5, 0], transition: { duration: 1.2, ease: 'easeInOut' } },
        }}
        initial="initial"
        animate={c}
      />
    </motion.svg>
  );
}

// ─── LogOut (arrow slides right) ────────────────────────────────────
export function AnimatedLogOut({ size = 16, animate }) {
  const c = useControlled(animate);
  return (
    <motion.svg {...svgProps} width={size} height={size} viewBox="0 0 24 24">
      <motion.g variants={{ initial: { x: 0, transition: { duration: 0.3, ease: 'easeInOut' } }, animate: { x: 2, transition: { duration: 0.3, ease: 'easeInOut' } } }} initial="initial" animate={c}>
        <path d="m16 17 5-5-5-5" />
        <path d="M21 12H9" />
      </motion.g>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    </motion.svg>
  );
}

// ─── Users (bounce) ─────────────────────────────────────────────────
export function AnimatedUsers({ size = 16, animate }) {
  const c = useControlled(animate);
  const v = (delay) => ({
    initial: { y: 0 },
    animate: { y: [0, 2, -2, 0], transition: { duration: 0.6, ease: 'easeInOut', delay } },
  });
  return (
    <motion.svg {...svgProps} width={size} height={size} viewBox="0 0 24 24">
      <motion.path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" variants={v(0.1)} initial="initial" animate={c} />
      <motion.path d="M16 3.128a4 4 0 0 1 0 7.744" variants={v(0)} initial="initial" animate={c} />
      <motion.path d="M22 21v-2a4 4 0 0 0-3-3.87" variants={v(0)} initial="initial" animate={c} />
      <motion.circle cx={9} cy={7} r={4} variants={v(0.1)} initial="initial" animate={c} />
    </motion.svg>
  );
}

// ─── Plus (rotate 90°) ──────────────────────────────────────────────
export function AnimatedPlus({ size = 14, animate }) {
  const c = useControlled(animate);
  return (
    <motion.svg {...svgProps} width={size} height={size} viewBox="0 0 24 24">
      <motion.line x1={12} y1={19} x2={12} y2={5} variants={{ initial: { rotate: 0, transition: { ease: 'easeInOut', duration: 0.4 } }, animate: { rotate: 90, transition: { ease: 'easeInOut', duration: 0.4, delay: 0.1 } } }} initial="initial" animate={c} />
      <motion.line x1={5} y1={12} x2={19} y2={12} variants={{ initial: { rotate: 0, transition: { ease: 'easeInOut', duration: 0.4 } }, animate: { rotate: 90, transition: { ease: 'easeInOut', duration: 0.4 } } }} initial="initial" animate={c} />
    </motion.svg>
  );
}

// ─── Globe (spin) ───────────────────────────────────────────────────
export function AnimatedGlobe({ size = 16, animate }) {
  const c = useControlled(animate);
  return (
    <motion.svg {...svgProps} width={size} height={size} viewBox="0 0 24 24">
      <motion.g
        variants={{
          initial: { rotateY: 0, transition: { duration: 0.6, ease: 'easeInOut' } },
          animate: { rotateY: 360, transition: { duration: 0.8, ease: 'easeInOut' } },
        }}
        initial="initial"
        animate={c}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </motion.g>
    </motion.svg>
  );
}

// ─── Bell (ring wobble) ─────────────────────────────────────────────
export function AnimatedBell({ size = 18, animate }) {
  const c = useControlled(animate);
  return (
    <motion.svg {...svgProps} width={size} height={size} viewBox="0 0 24 24"
      style={{ transformOrigin: 'top center' }}
      variants={{ initial: { rotate: 0 }, animate: { rotate: [0, 20, -10, 10, -5, 3, 0], transition: { duration: 0.9, ease: 'easeInOut' } } }}
      initial="initial" animate={c}
    >
      <motion.path
        d="M10.268 21a2 2 0 0 0 3.464 0"
        variants={{ initial: { x: 0 }, animate: { x: [0, -6, 5, -5, 4, -3, 2, 0], transition: { duration: 1.1, ease: 'easeInOut' } } }}
        initial="initial" animate={c}
      />
      <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
    </motion.svg>
  );
}

// ─── ChevronDown (bounce down) ──────────────────────────────────────
export function AnimatedChevronDown({ size = 16, animate }) {
  const c = useControlled(animate);
  return (
    <motion.svg {...svgProps} width={size} height={size} viewBox="0 0 24 24">
      <motion.path d="m6 9 6 6 6-6" variants={{ initial: { y: 0, transition: { duration: 0.3, ease: 'easeInOut' } }, animate: { y: 4, transition: { duration: 0.3, ease: 'easeInOut' } } }} initial="initial" animate={c} />
    </motion.svg>
  );
}
