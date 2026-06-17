interface AgnesLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export default function AgnesLogo({ className = '', size = 32, showText = false }: AgnesLogoProps) {
  const aspectRatio = showText ? 3.2 : 1;
  const width = showText ? size * aspectRatio : size;
  const height = size;

  return (
    <svg
      width={width}
      height={height}
      viewBox={showText ? '0 0 160 50' : '0 0 50 50'}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Agnes AI Logo"
    >
      <defs>
        <linearGradient id="ag-logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="ag-logo-grad-h" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <filter id="ag-logo-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="ag-logo-glow-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Background glow circle */}
      <circle
        cx="25"
        cy="25"
        r="22"
        fill="url(#ag-logo-grad)"
        opacity="0.12"
        filter="url(#ag-logo-glow-soft)"
      />

      {/* Outer ring - neural network circuit */}
      <circle
        cx="25"
        cy="25"
        r="21"
        stroke="url(#ag-logo-grad)"
        strokeWidth="1.2"
        strokeDasharray="8 4"
        opacity="0.4"
      />

      {/* Letter "A" - geometric construction */}
      {/* Left leg */}
      <path
        d="M12 40 L23 8 L25 8 L14 40 Z"
        fill="url(#ag-logo-grad)"
        opacity="0.9"
      />
      {/* Right leg */}
      <path
        d="M38 40 L27 8 L25 8 L36 40 Z"
        fill="url(#ag-logo-grad)"
        opacity="0.9"
      />
      {/* Crossbar */}
      <path
        d="M16 28 L34 28 L33 24 L17 24 Z"
        fill="url(#ag-logo-grad)"
        opacity="0.95"
      />

      {/* Neural network nodes */}
      {/* Top node */}
      <circle cx="25" cy="6" r="2.5" fill="#7c3aed" filter="url(#ag-logo-glow)" />
      <circle cx="25" cy="6" r="1.2" fill="#c4b5fd" />

      {/* Left node */}
      <circle cx="8" cy="25" r="2.5" fill="#8b5cf6" filter="url(#ag-logo-glow)" />
      <circle cx="8" cy="25" r="1.2" fill="#c4b5fd" />

      {/* Right node */}
      <circle cx="42" cy="25" r="2.5" fill="#06b6d4" filter="url(#ag-logo-glow)" />
      <circle cx="42" cy="25" r="1.2" fill="#a5f3fc" />

      {/* Bottom-left node */}
      <circle cx="14" cy="43" r="2" fill="#7c3aed" filter="url(#ag-logo-glow)" />
      <circle cx="14" cy="43" r="1" fill="#c4b5fd" />

      {/* Bottom-right node */}
      <circle cx="36" cy="43" r="2" fill="#06b6d4" filter="url(#ag-logo-glow)" />
      <circle cx="36" cy="43" r="1" fill="#a5f3fc" />

      {/* Connection lines - neural network edges */}
      <line x1="25" y1="8.5" x2="25" y2="6" stroke="#7c3aed" strokeWidth="0.8" opacity="0.5" />
      <line x1="10.5" y1="25" x2="8" y2="25" stroke="#8b5cf6" strokeWidth="0.8" opacity="0.5" />
      <line x1="39.5" y1="25" x2="42" y2="25" stroke="#06b6d4" strokeWidth="0.8" opacity="0.5" />

      {/* Multi-modal dots - text/image/video */}
      <circle cx="20" cy="14" r="1.5" fill="#a78bfa" opacity="0.8" />
      <circle cx="30" cy="14" r="1.5" fill="#22d3ee" opacity="0.8" />
      <circle cx="25" cy="18" r="1.5" fill="#c084fc" opacity="0.8" />

      {/* Text label (only when showText is true) */}
      {showText && (
        <>
          <text
            x="58"
            y="30"
            fill="url(#ag-logo-grad-h)"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="22"
            fontWeight="700"
            letterSpacing="-0.5"
          >
            Agnes AI
          </text>
          <text
            x="58"
            y="44"
            fill="currentColor"
            opacity="0.45"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="11"
            fontWeight="500"
            letterSpacing="1.5"
          >
            在线演示平台
          </text>
        </>
      )}
    </svg>
  );
}
