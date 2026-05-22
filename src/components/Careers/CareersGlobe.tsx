const CareersGlobe = () => {
  const R = 400;
  const cx = 500;
  const cy = 450;

  const latitudes: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const yOffset = i * 40;
    if (cy - yOffset >= cy - R) {
      const w = Math.sqrt(R * R - yOffset * yOffset);
      latitudes.push(`M ${cx - w} ${cy - yOffset} L ${cx + w} ${cy - yOffset}`);
    }
    if (cy + yOffset <= cy + R) {
      const w = Math.sqrt(R * R - yOffset * yOffset);
      latitudes.push(`M ${cx - w} ${cy + yOffset} L ${cx + w} ${cy + yOffset}`);
    }
  }
  latitudes.push(`M ${cx - R} ${cy} L ${cx + R} ${cy}`);

  const longitudes: string[] = [];
  longitudes.push(`M ${cx} ${cy - R} L ${cx} ${cy + R}`);
  const numLongitudes = 8;
  for (let i = 1; i <= numLongitudes; i++) {
    const rx = (R / numLongitudes) * i;
    longitudes.push(`M ${cx} ${cy - R} A ${rx} ${R} 0 0 1 ${cx} ${cy + R}`);
    longitudes.push(`M ${cx} ${cy - R} A ${rx} ${R} 0 0 0 ${cx} ${cy + R}`);
  }

  const allLines = [...latitudes, ...longitudes];

  const animatedLines: { d: string; duration: string; delay: string; color: string; reverse: boolean }[] = [];
  const addAnimatedLine = (d: string, duration: number, delay: number, color: string, reverse: boolean) => {
    animatedLines.push({ d, duration: `${duration}s`, delay: `${delay}s`, color, reverse });
  };

  longitudes.forEach((d, i) => {
    if (i % 2 === 0 || i === 1) {
      const r1 = ((i * 17) % 10) / 10;
      const r2 = ((i * 23) % 10) / 10;
      const reverse1 = r1 > 0.5;
      const reverse2 = r2 > 0.5;
      const color1 = reverse1 ? 'url(#glow-gradient-2)' : 'url(#glow-gradient-1)';
      const color2 = reverse2 ? 'url(#glow-gradient-1)' : 'url(#glow-gradient-2)';
      addAnimatedLine(d, 3 + r1 * 4, r2 * 5, color1, reverse1);
      addAnimatedLine(d, 4 + r2 * 4, r1 * 8 + 3, color2, reverse2);
    }
  });

  latitudes.forEach((d, i) => {
    if (i % 3 === 0 || i === 2) {
      const r1 = ((i * 13) % 10) / 10;
      const r2 = ((i * 19) % 10) / 10;
      const reverse1 = r2 > 0.5;
      const reverse2 = r1 > 0.5;
      const color1 = reverse1 ? 'url(#glow-gradient-2)' : 'url(#glow-gradient-1)';
      const color2 = reverse2 ? 'url(#glow-gradient-1)' : 'url(#glow-gradient-2)';
      addAnimatedLine(d, 4 + r1 * 4, r2 * 6, color1, reverse1);
      addAnimatedLine(d, 3 + r2 * 4, r1 * 8 + 4, color2, reverse2);
    }
  });

  return (
    <div className="globe-container">
      <svg className="globe-svg" viewBox="0 0 1000 800" preserveAspectRatio="xMidYMin slice" style={{ width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="glow-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>
          <linearGradient id="glow-gradient-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
          <linearGradient id="globe-fade" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fff" stopOpacity={1} />
            <stop offset="60%" stopColor="#fff" stopOpacity={1} />
            <stop offset="100%" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
        </defs>

        <g mask="url(#globe-fade-mask)">
          <mask id="globe-fade-mask">
            <rect x="0" y="0" width="1000" height="800" fill="url(#globe-fade)" />
          </mask>
          <circle cx={cx} cy={cy} r={R} fill="var(--bg)" />
          <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--border)" strokeWidth="1" />
          {allLines.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="var(--border)" strokeWidth="1" />
          ))}

          {animatedLines.map((line, i) => (
            <path
              key={`anim-${i}`}
              d={line.d}
              fill="none"
              stroke={line.color}
              strokeWidth="2"
              className={`animated-glow-line ${line.reverse ? 'reverse' : ''}`}
              style={{
                animationDuration: line.duration,
                animationDelay: line.delay,
              }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};

export default CareersGlobe;
