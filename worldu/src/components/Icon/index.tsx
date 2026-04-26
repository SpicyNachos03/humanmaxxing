import {
  CheckCircle,
  Walking,
  Trash,
  ChatBubble,
  Yoga,
  Community,
  Heart,
  Tree,
  DashFlag,
  FireFlame,
  Flash,
  Star,
  Trophy,
  Group,
  ShieldCheck,
  Globe,
  Search,
  ClipboardCheck,
  Lock,
  Label,
  MapPin,
  Camera,
  Medal,
  Medal1st,
  Gift,
  CoffeeCup,
  Shirt,
  Crown,
} from 'iconoir-react';
import { ComponentType } from 'react';

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  'check-circle': CheckCircle,
  walking: Walking,
  trash: Trash,
  'chat-bubble': ChatBubble,
  yoga: Yoga,
  community: Community,
  heart: Heart,
  tree: Tree,
  'dash-flag': DashFlag,
  'fire-flame': FireFlame,
  flash: Flash,
  star: Star,
  trophy: Trophy,
  group: Group,
  'shield-check': ShieldCheck,
  globe: Globe,
  search: Search,
  'clipboard-check': ClipboardCheck,
  lock: Lock,
  label: Label,
  'map-pin': MapPin,
  camera: Camera,
  medal: Medal,
  'medal-1st': Medal1st,
  gift: Gift,
  'coffee-cup': CoffeeCup,
  shirt: Shirt,
  crown: Crown,
};

interface IconProps {
  name: string;
  className?: string;
}

export const Icon = ({ name, className = 'w-5 h-5' }: IconProps) => {
  const IconComponent = iconMap[name];
  if (!IconComponent) return null;
  return <IconComponent className={className} />;
};

export { iconMap };
