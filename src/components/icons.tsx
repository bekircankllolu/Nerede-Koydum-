import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

type IconProps = { size?: number; color?: string };

export function SearchIcon({ size = 18, color = '#6E6E73' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={7} stroke={color} strokeWidth={2} />
      <Path d="M16.5 16.5L21 21" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function MicIcon({ size = 19, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={9} y={3} width={6} height={11} rx={3} fill={color} />
      <Path d="M5.5 11.5a6.5 6.5 0 0013 0M12 18v3" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function PlusIcon({ size = 17, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

export function ChevronRight({ size = 18, color = '#C4C4C8' }: IconProps) {
  return (
    <Svg width={size * 0.5} height={size} viewBox="0 0 8 14">
      <Path d="M1 1l6 6-6 6" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PhotoIcon({ size = 26, color = '#A9A29A' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={6} width={18} height={14} rx={3} stroke={color} strokeWidth={1.6} />
      <Circle cx={12} cy={13} r={3.6} stroke={color} strokeWidth={1.6} />
      <Path d="M8 6l1.4-2h5.2L16 6" stroke={color} strokeWidth={1.6} />
    </Svg>
  );
}

export function CheckIcon({ size = 17, color = '#8B8CEB' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 12.5l5 5L20 6.5" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}

export function CloseIcon({ size = 17, color = '#6E6E73' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 5l14 14M19 5L5 19" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function TabFindIcon({ size = 23, color = '#9A968F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={7} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16.5 16.5L21 21" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function TabItemsIcon({ size = 23, color = '#9A968F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={5} width={18} height={14} rx={2.5} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 11h18M10 11v8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function TabSettingsIcon({ size = 23, color = '#9A968F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={3.2} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M12 3.5v2M12 18.5v2M4.6 7.8l1.7 1M17.7 15.2l1.7 1M4.6 16.2l1.7-1M17.7 8.8l1.7-1"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function TabLostIcon({ size = 23, color = '#9A968F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={8.5} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M9.5 9.7a2.5 2.5 0 114.3 1.7c-.75.7-1.5 1.15-1.5 2.3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={12.3} cy={16.9} r={1.1} fill={color} />
    </Svg>
  );
}

export function StarIcon({ size = 22, color = '#fff', filled = true }: IconProps & { filled?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.6l2.47 5.13 5.53.62-4.1 3.83 1.1 5.6L12 15.95l-4.99 2.83 1.1-5.6-4.1-3.83 5.52-.62L12 3.6z"
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function TrashIcon({ size = 22, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4.5 7h15" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M9.2 7V5.2a1 1 0 011-1h3.6a1 1 0 011 1V7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6.7 7l.85 12.1a2 2 0 002 1.9h4.9a2 2 0 002-1.9L17.3 7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10.2 10.8v6.2M13.8 10.8v6.2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

// Clock face with a counter-clockwise arrow — the same 24-unit grid, 2pt
// round-capped stroke language as the tab icons.
export function HistoryIcon({ size = 19, color = '#6E6E73' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9.1 4 A 8.5 8.5 0 1 1 3.5 12"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M1.3 14.2L3.5 12l2.2 2.2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 7.8V12l3.4 1.9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Settings-row glyphs: same 24-unit grid and round-capped stroke language as
// the rest of icons.tsx, kept intentionally plain (no extra detail) since
// they sit small and muted next to a label.

export function ExportIcon({ size = 18, color = '#6E6E73' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3.2v11" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M8 7.2L12 3.2l4 4" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 12.5v5.3a2 2 0 002 2h10a2 2 0 002-2v-5.3" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function GlobeIcon({ size = 18, color = '#6E6E73' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={8.3} stroke={color} strokeWidth={1.8} />
      <Path d="M3.7 12h16.6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M12 3.7c3 2.2 3 14.4 0 16.6c-3-2.2-3-14.4 0-16.6z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    </Svg>
  );
}

export function LockIcon({ size = 18, color = '#6E6E73' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={5.5} y={10.5} width={13} height={9.5} rx={2.5} stroke={color} strokeWidth={1.8} />
      <Path d="M8 10.5V7.5a4 4 0 018 0v3" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx={12} cy={15} r={1.2} fill={color} />
    </Svg>
  );
}

export function RestoreIcon({ size = 18, color = '#6E6E73' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.8 12a7.2 7.2 0 1 1 2.1 5.1"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M4.3 16.4V12h4.4" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function HelpIcon({ size = 18, color = '#6E6E73' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={8.5} stroke={color} strokeWidth={1.8} />
      <Path
        d="M9.5 9.7a2.5 2.5 0 114.3 1.7c-.75.7-1.5 1.15-1.5 2.3"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={12.3} cy={16.9} r={1.1} fill={color} />
    </Svg>
  );
}

export function ShieldIcon({ size = 18, color = '#5556D9' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.5l7 2.6v5.4c0 4.6-3 7.9-7 9-4-1.1-7-4.4-7-9V6.1l7-2.6z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M9 12.3l2.1 2.1L15.3 10" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PencilIcon({ size = 18, color = '#5556D9' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 20l.9-4.1L15.4 5.3a1.6 1.6 0 012.3 0l1 1a1.6 1.6 0 010 2.3L8.1 19.1 4 20z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M13.5 7l3.5 3.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}
