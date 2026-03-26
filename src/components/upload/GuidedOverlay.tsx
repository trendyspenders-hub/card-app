'use client';

import { motion } from 'framer-motion';

interface GuidedOverlayProps {
  cardDetected?: boolean;
  width?: number;
  height?: number;
}

export default function GuidedOverlay({
  cardDetected = false,
  width = 400,
  height = 300,
}: GuidedOverlayProps) {
  const padding = 24;
  const cardW = width - padding * 2;
  const cardH = height - padding * 2;
  const cx = width / 2;
  const cy = height / 2;
  const cornerSize = 20;

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Dimmed overlay outside card area */}
      <mask id="cardMask">
        <rect width={width} height={height} fill="white" />
        <rect
          x={padding}
          y={padding}
          width={cardW}
          height={cardH}
          rx={4}
          fill="black"
        />
      </mask>
      <rect
        width={width}
        height={height}
        fill="rgba(0,0,0,0.45)"
        mask="url(#cardMask)"
      />

      {/* Card outline */}
      <motion.rect
        x={padding}
        y={padding}
        width={cardW}
        height={cardH}
        rx={4}
        fill="none"
        stroke={cardDetected ? '#10b981' : '#6366f1'}
        strokeWidth="2"
        strokeDasharray={cardDetected ? '0' : '8 4'}
        animate={
          cardDetected
            ? { strokeOpacity: [1, 0.6, 1] }
            : { strokeDashoffset: [0, -24] }
        }
        transition={
          cardDetected
            ? { duration: 1.5, repeat: Infinity }
            : { duration: 1.2, repeat: Infinity, ease: 'linear' }
        }
      />

      {/* Corner markers - Top Left */}
      <g stroke={cardDetected ? '#10b981' : '#6366f1'} strokeWidth="3" fill="none" strokeLinecap="round">
        <line x1={padding} y1={padding + cornerSize} x2={padding} y2={padding} />
        <line x1={padding} y1={padding} x2={padding + cornerSize} y2={padding} />

        {/* Top Right */}
        <line x1={padding + cardW - cornerSize} y1={padding} x2={padding + cardW} y2={padding} />
        <line x1={padding + cardW} y1={padding} x2={padding + cardW} y2={padding + cornerSize} />

        {/* Bottom Left */}
        <line x1={padding} y1={padding + cardH - cornerSize} x2={padding} y2={padding + cardH} />
        <line x1={padding} y1={padding + cardH} x2={padding + cornerSize} y2={padding + cardH} />

        {/* Bottom Right */}
        <line x1={padding + cardW - cornerSize} y1={padding + cardH} x2={padding + cardW} y2={padding + cardH} />
        <line x1={padding + cardW} y1={padding + cardH} x2={padding + cardW} y2={padding + cardH - cornerSize} />
      </g>

      {/* Center crosshair */}
      <g stroke={cardDetected ? '#10b981' : 'rgba(255,255,255,0.4)'} strokeWidth="1" strokeDasharray="4 3">
        <line x1={cx - 15} y1={cy} x2={cx + 15} y2={cy} />
        <line x1={cx} y1={cy - 15} x2={cx} y2={cy + 15} />
      </g>

      {/* Border measurement guides */}
      <g stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" strokeDasharray="3 3">
        {/* Horizontal center line */}
        <line x1={padding} y1={cy} x2={padding + cardW} y2={cy} />
        {/* Vertical center line */}
        <line x1={cx} y1={padding} x2={cx} y2={padding + cardH} />
      </g>

      {/* Label */}
      <text
        x={cx}
        y={height - 8}
        textAnchor="middle"
        fill={cardDetected ? '#10b981' : 'rgba(255,255,255,0.6)'}
        fontSize="11"
        fontFamily="sans-serif"
      >
        {cardDetected ? 'Card detected — hold still' : 'Align card within guides'}
      </text>
    </svg>
  );
}
