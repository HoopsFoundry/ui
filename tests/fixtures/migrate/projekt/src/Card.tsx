import type { CSSProperties } from 'react';

const style = { '--dss-card-title-size': '1.5rem', '--dss-selected-bg': 'var(--signal-50)', color: 'var(--dss-mute)' } as CSSProperties;
export const Card = () => <div className="dss-card" style={style}>Karte</div>;
