import { environmentCssVariables } from './visual'
import type { EnvironmentState } from './types'

const stars = [
  [7, 18, 0.7], [13, 30, 0.45], [19, 11, 0.52], [24, 42, 0.6], [31, 20, 0.38],
  [37, 34, 0.64], [43, 13, 0.48], [49, 28, 0.55], [56, 10, 0.4], [62, 38, 0.72],
  [68, 18, 0.34], [74, 45, 0.58], [81, 25, 0.48], [88, 14, 0.68], [93, 36, 0.4],
  [11, 55, 0.52], [28, 61, 0.42], [46, 54, 0.36], [63, 62, 0.55], [77, 58, 0.43],
  [84, 72, 0.32], [96, 63, 0.52], [54, 71, 0.33], [36, 75, 0.46],
] as const

interface EnvironmentSceneProps {
  environment: EnvironmentState
}

export function EnvironmentScene({ environment }: EnvironmentSceneProps) {
  const vars = environmentCssVariables(environment)

  return (
    <div className="environment-scene" data-day-phase={environment.dayPhase} data-weather={environment.weather?.condition ?? 'clear'} style={vars} aria-hidden="true">
      <div className="environment-sky" />
      <picture className="environment-photograph" aria-hidden="true">
        <source
          media="(max-width: 760px)"
          srcSet="https://images.unsplash.com/photo-1738237290887-9e70351567d4?fm=avif&q=55&w=900&fit=crop&crop=entropy"
          type="image/avif"
        />
        <img
          src="https://images.unsplash.com/photo-1738237290887-9e70351567d4?fm=avif&q=55&w=1600&fit=crop&crop=entropy"
          alt=""
          loading="eager"
          fetchPriority="low"
          decoding="async"
        />
      </picture>
      <div className="environment-stars">
        {stars.map(([left, top, opacity], index) => (
          <i key={index} style={{ left: left + '%', top: top + '%', opacity }} />
        ))}
      </div>
      <div className="environment-clouds" />
      <div className="environment-sun" />
      <div className="environment-moon" />
      <div className="environment-light-shafts" />
      <div className="environment-horizon" />
      <svg className="environment-terrain" viewBox="0 0 1440 900" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="mid-far-ridge" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#465640" stopOpacity=".68" />
            <stop offset="1" stopColor="#172118" stopOpacity=".96" />
          </linearGradient>
          <linearGradient id="mid-near-ridge" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#31452f" stopOpacity=".92" />
            <stop offset="1" stopColor="#101710" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="mid-ground" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#243625" stopOpacity=".86" />
            <stop offset=".42" stopColor="#131d14" stopOpacity=".96" />
            <stop offset="1" stopColor="#090d09" stopOpacity="1" />
          </linearGradient>
        </defs>
        <path className="terrain-far" fill="url(#mid-far-ridge)" d="M0 560C110 520 150 430 250 472C340 510 372 396 488 446C594 491 622 404 730 448C820 486 876 392 982 452C1085 511 1135 420 1244 456C1320 481 1375 454 1440 430V900H0Z" />
        <path className="terrain-mid" fill="url(#mid-near-ridge)" d="M0 650C90 602 153 520 242 566C315 604 360 540 432 576C514 617 568 496 670 554C760 605 812 525 918 576C1004 619 1055 520 1144 568C1247 622 1298 548 1390 578C1415 587 1432 580 1440 576V900H0Z" />
        <path className="terrain-ground" fill="url(#mid-ground)" d="M0 738C124 688 234 706 328 730C418 753 505 682 606 712C718 745 781 674 886 720C984 760 1080 691 1184 734C1284 774 1366 720 1440 716V900H0Z" />
        <g className="terrain-trees terrain-trees-back">
          <path d="M98 652l36-92 36 92h-18l27 52h-90l27-52zM216 620l29-76 29 76h-15l22 48h-72l22-48zM338 648l34-88 34 88h-17l25 53h-84l25-53zM1104 628l32-82 32 82h-16l24 51h-80l24-51zM1208 648l38-98 38 98h-18l26 56h-92l26-56zM1322 618l28-74 28 74h-14l22 48h-72l22-48z" />
        </g>
        <g className="terrain-trees terrain-trees-front">
          <path d="M18 796l60-164 60 164h-32l48 104H0l46-104zM124 812l45-124 45 124h-24l36 88H86l36-88zM1320 808l54-150 54 150h-28l40 92h-132l40-92zM1128 824l48-132 48 132h-26l34 76h-112l34-76z" />
        </g>
        <path className="terrain-mist-bank" d="M0 704C180 664 302 710 438 696C566 682 640 644 786 680C936 717 1044 675 1172 692C1272 706 1350 685 1440 674V758C1324 736 1220 762 1104 748C970 733 854 768 716 736C575 703 476 760 330 738C210 720 116 736 0 752Z" />
      </svg>
      <div className="environment-canopy">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="environment-fog" />
      <div className="environment-rain" />
      <div className="environment-vignette" />
      <span className="environment-attribution">
        {environment.weather ? 'Nature photo: Nicholas Bullett / Unsplash · Weather: Open-Meteo' : 'Nature photo: Nicholas Bullett / Unsplash'}
      </span>
    </div>
  )
}
