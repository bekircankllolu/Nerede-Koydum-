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
