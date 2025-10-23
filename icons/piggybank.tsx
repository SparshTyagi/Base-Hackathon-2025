import * as React from "react";

type Props = {
  className?: string;
  title?: string;
  bodyStart?: string;
  bodyEnd?: string;
  accent?: string;
  line?: string;
};

const PiggyBankSVG: React.FC<Props> = ({
  className,
  title,
  bodyStart = "var(--piggy-body-start, #FFD4E8)",
  bodyEnd   = "var(--piggy-body-end,   #FF89C2)",
  accent    = "var(--piggy-accent,     #A78BFA)",
  line      = "var(--piggy-line,       #0F172A)"
}) => {
  const id = React.useId();
  const titleId = title ? `${id}-title` : undefined;
  const gid = (name: string) => `${id}-${name}`;

  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      role={title ? "img" : "presentation"}
      aria-labelledby={titleId}
      aria-hidden={title ? undefined : true}
      focusable="false"
      style={{
  background: "none",
  overflow: "visible",
  display: "block",
  isolation: "isolate",
}}
    >
      {title ? <title id={titleId}>{title}</title> : null}

      {/* ---- Defs (unchanged from original where possible) ---- */}
      <defs>
        {/* Body radial gradient */}
        <radialGradient id={gid("bodyGrad")} cx="52%" cy="42%" r="70%">
          <stop offset="0%"  stopColor={bodyStart} />
          <stop offset="100%" stopColor={bodyEnd} />
        </radialGradient>

        {/* Rim-light along top edge */}
        <linearGradient id={gid("rimGrad")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.55"/>
          <stop offset="60%"  stopColor="#FFFFFF" stopOpacity="0"/>
        </linearGradient>

        {/* Gloss highlight */}
        <linearGradient id={gid("glossGrad")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.70"/>
          <stop offset="60%"  stopColor="#FFFFFF" stopOpacity="0.0"/>
        </linearGradient>

        {/* Subtle paper-like noise for richness */}
        {/* <filter id={gid("noise")} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n"/>
          <feColorMatrix type="saturate" values="0"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.03"/>
          </feComponentTransfer>
          <feBlend in="SourceGraphic" mode="multiply"/>
        </filter> */}

        {/* Soft drop shadow */}
        <filter id={gid("shadow")} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0F172A" floodOpacity="0.18"/>
        </filter>

        {/* Inner shadow helper */}
        <filter id={gid("inner")} x="-50%" y="-50%" width="200%" height="200%">
          <feOffset dx="0" dy="1"/>
          <feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="arithmetic" k2="-1" k3="1"/>
          <feColorMatrix type="matrix" values="
              0 0 0 0 0
              0 0 0 0 0
              0 0 0 0 0
              0 0 0 .65 0"/>
        </filter>

        {/* Slot inset shadow */}
        <filter id={gid("slotInset")} x="-50%" y="-50%" width="200%" height="200%">
          <feOffset dy="1"/>
          <feGaussianBlur stdDeviation="1.2" result="b"/>
          <feComposite in="SourceGraphic" in2="b" operator="arithmetic" k2="-1" k3="1"/>
          <feColorMatrix type="matrix" values="
              0 0 0 0 0
              0 0 0 0 0
              0 0 0 0 0
              0 0 0 .85 0"/>
        </filter>

        {/* Ground shadow under pig */}
        <radialGradient id={gid("ground")} cx="50%" cy="50%" r="60%">
          <stop offset="0%"  stopColor="#000" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#000" stopOpacity="0"/>
        </radialGradient>

        {/* Ear gradients (front/back + inner flap) */}
        <linearGradient id={gid("earFront")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor={bodyStart} />
          <stop offset="100%" stopColor={bodyEnd} />
        </linearGradient>
        <linearGradient id={gid("earBack")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor={bodyEnd} />
          <stop offset="100%" stopColor="#E87FB8" />
        </linearGradient>
        <linearGradient id={gid("earInner")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#FFD1E4" />
          <stop offset="100%" stopColor="#FFB7D8" />
        </linearGradient>
      </defs>

      {/* ---- Ground shadow ---- */}
      <ellipse cx="110" cy="168" rx="66" ry="16" fill={`url(#${gid("ground")})`} />

      {/* ---- Rear ear (behind head) ---- */}
      {/* Drawn BEFORE body group so it tucks behind */}
      <g filter={`url(#${gid("shadow")})`}>
        <path
          d="M128 70 q10 -16 24 -12 q-4 16 -15 26 q-7 -6 -9 -14 z"
          fill={`url(#${gid("earBack")})`}
          opacity="0.75"
        />
      </g>

     <g filter={`url(#${gid("shadow")})`}>
        {/* Back legs */}
        <g id={gid("backLegs")} transform="scale(0.2) translate(195,240)">
          <g transform="translate(145,540)">
            <path
              d="M0,0c18,-35 57,-56 95,-51c31,4 52,23 57,48c5,25 -7,53 -31,70c-24,17 -59,22 -85,10c-29,-13 -55,-43 -36,-77z"
              fill={`url(#${gid("bodyGrad")})`}
              filter={`url(#${gid("shadow")})`}
            />
          </g>

          <g transform="translate(480,540)">
            <path
              d="M0,0c18,-35 57,-56 95,-51c31,4 52,23 57,48c5,25 -7,53 -31,70c-24,17 -59,22 -85,10c-29,-13 -55,-43 -36,-77z"
              fill={`url(#${gid("bodyGrad")})`}
              filter={`url(#${gid("shadow")})`}
            />
          </g>
        </g>

      {/* ---- Pig body group (original visuals retained) ---- */}
        {/* main body */}
        <ellipse
          cx="110" cy="118" rx="72" ry="50"
          fill={`url(#${gid("bodyGrad")})`}
          filter={`url(#${gid("noise")})`}
        />

{/* <g transform="translate(80,120) scale(0.4)">
  <rect x="0" y="0" width="40" height="40" fill="#0052FF" rx="6" />
  <text
    x="50"
    y="30"
    fontFamily="Arial, Helvetica, sans-serif"
    fontWeight="700"
    fontSize="32"
    fill="#000"
  >
    base
  </text>
</g> */}
        {/* inner shadow for depth */}
        <ellipse
          cx="110" cy="118" rx="72" ry="50"
          fill="transparent"
          filter={`url(#${gid("inner")})`}
          style={{ mixBlendMode: "multiply" }}
        />

        {/* FRONT ear (primary) */}
        <g transform="translate(-3,1) rotate(-12 144 72)">
          {/* ear shape */}
          <path
            d="M144 72 q14 -16 26 -8 q-6 16 -17 26 q-7 -8 -9 -18 z"
            fill={`url(#${gid("earFront")})`}
            opacity="0.95"
          />
          {/* subtle inner flap to read at small sizes */}
          <path
            d="M146 74 q10 -10 18 -6 q-3 10 -11 17 q-5 -5 -7 -11 z"
            fill={`url(#${gid("earInner")})`}
            opacity="0.65"
          />
          {/* tiny specular edge along the top of the ear */}
          <path
            d="M146 70 q10 -10 22 -6"
            fill="none"
            stroke="#fff"
            strokeOpacity=".25"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>

        {/* Snout */}
        <g id={gid("snout")} transform="scale(0.2) translate(138,35)" filter={`url(#${gid("shadow")})`}>
            <ellipse cx="732" cy="510" rx="110" ry="100" fill={`url(#${gid("bodyGrad")})`} />
            <ellipse cx="732" cy="523" rx="112" ry="78" fill="#FFB4D8" opacity="0.35" />
            <g>
              <ellipse cx="698" cy="515" rx="15" ry="22" fill={line} />
              <ellipse cx="766" cy="515" rx="15" ry="22" fill={line} />
            </g>
          </g>

        {/* Eyes */}
        <g id={gid("eyes")} transform="scale(0.2) translate(150,35)">
            {/* Left eye */}
            <g transform="translate(470,420)">
              <circle cx="40" cy="0" r="26" fill={line} />
              <circle cx="32" cy="-10" r="9" fill="#FFF" opacity="0.6" />
            </g>
            {/* Right eye */}
            <g transform="translate(540,405)">
              <circle cx="40" cy="0" r="23" fill={line} />
              <circle cx="33" cy="-9" r="8" fill="#FFF" opacity="0.6" />
            </g>
          </g>

        <g id={gid("legs")} transform="scale(0.2) translate(195,240)">

        {/* Front left leg */}
        <g transform="translate(200,580)">
            <path
            d="M0,0c20,-33 58,-52 95,-46c28,5 49,22 55,44c7,25 -4,53 -26,68c-24,17 -58,22 -85,11c-30,-12 -61,-43 -39,-77z"
            fill={`url(#${gid("bodyGrad")})`}
            filter={`url(#${gid("shadow")})`}
            />
        </g>

        {/* Front right leg */}
        <g transform="translate(520,580)">
            <path
            d="M0,0c20,-33 58,-52 95,-46c28,5 49,22 55,44c7,25 -4,53 -26,68c-24,17 -58,22 -85,11c-30,-12 -61,-43 -39,-77z"
            fill={`url(#${gid("bodyGrad")})`}
            filter={`url(#${gid("shadow")})`}
            />
        </g>
        </g>

        {/* Corkscrew tail */}
        <path
          d="M38 120
             c -10 6 -8 18 5 19
             c 10 1 14 -9 7 -13
             c -6 -3 -11 4 -5 8
             c 5 3 12 -1 11 -7"
          fill="none"
          stroke={bodyEnd}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M38 120
             c -8 5 -6 14 4 15
             c 8 1 11 -7 5 -10
             c -5 -2 -8 3 -4 6"
          fill="none"
          stroke="#FFD9EA"
          strokeWidth="3"
          strokeLinecap="round"
          opacity=".75"
        />

        {/* Slot */}
        <g id={gid("slot")}>
          {/* outer rim */}
          <rect
            x="96" y="72" width="32" height="8" rx="3"
            fill={line}
            filter={`url(#${gid("slotInset")})`}
          />
          {/* inner "opening" (darker, inset) */}
          <rect
            x="99" y="74" width="26" height="4" rx="2"
            fill="#0B1220"
            opacity="0.9"
            style={{ mixBlendMode: "multiply" }}
          />
          {/* thin top highlight to suggest a cut edge */}
          <rect
            x="99" y="74" width="26" height="1" rx="1"
            fill="#fff"
            opacity="0.18"
          />
          {/* subtle bottom shadow inside the slot */}
          <rect
            x="99" y="77" width="26" height="1.5" rx="1"
            fill="#000"
            opacity="0.18"
          />
        </g>

      </g>
    </svg>
  );
};

export default PiggyBankSVG;
