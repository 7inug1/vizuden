export function StepNumber({ n, status }) {
  const locked = status === 'locked';
  const done = status === 'done';
  return (
    <div style={{
      width: 24, height: 24, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `1px solid ${locked ? '#d6d3d1' : '#1c1917'}`,
      backgroundColor: done ? '#1c1917' : 'transparent',
    }}>
      <span style={{
        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        fontSize: '9px', letterSpacing: '0.05em', lineHeight: 1,
        color: done ? '#fafaf9' : locked ? '#a8a29e' : '#1c1917',
      }}>{n}</span>
    </div>
  );
}

export function StepLine({ locked }) {
  return (
    <div style={{
      flex: 1, width: 1, marginTop: 4,
      backgroundImage: locked
        ? 'repeating-linear-gradient(to bottom, #d6d3d1 0px, #d6d3d1 4px, transparent 4px, transparent 8px)'
        : undefined,
      backgroundColor: locked ? undefined : '#d6d3d1',
    }} />
  );
}
