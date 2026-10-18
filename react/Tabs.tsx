import { useRef, useState, type KeyboardEvent } from 'react';
import { Icon, type IconName } from './Icon';
import { cn } from './cn';
import { useT } from './i18n';
import { nextTab } from '../js/tabs.js';

export interface TabItem {
  id: string;
  label: string;
  icon?: IconName;
  count?: number;
  disabled?: boolean;
}

export type TabsVariant = 'underline' | 'segmented' | 'pills' | 'vertical';
export type TabsSize = 'sm' | 'md' | 'lg';

export interface TabsProps {
  items: TabItem[];
  variant?: TabsVariant;
  size?: TabsSize;
  ariaLabel?: string;
  className?: string;
  /** Einzelauswahl: kontrolliert (value) oder unkontrolliert (defaultValue). */
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  /** Mehrfachauswahl (Pills als Filter): kontrolliert (activeIds) oder unkontrolliert. */
  multi?: boolean;
  activeIds?: string[];
  defaultActiveIds?: string[];
  onActiveIdsChange?: (ids: string[]) => void;
}

export function Tabs({
  items,
  variant = 'underline',
  size = 'md',
  ariaLabel,
  className,
  value: valueProp,
  defaultValue,
  onValueChange,
  multi = false,
  activeIds: activeIdsProp,
  defaultActiveIds = [],
  onActiveIdsChange,
}: TabsProps) {
  const i18n = useT();
  const firstEnabled = items.find((item) => !item.disabled)?.id ?? '';
  const [innerValue, setInnerValue] = useState(defaultValue ?? firstEnabled);
  const [innerActiveIds, setInnerActiveIds] = useState(defaultActiveIds);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  const value = valueProp ?? innerValue;
  const activeIds = activeIdsProp ?? innerActiveIds;
  const isActive = (id: string) => (multi ? activeIds.includes(id) : value === id);

  const select = (item: TabItem) => {
    if (item.disabled) return;
    if (multi) {
      const next = activeIds.includes(item.id) ? activeIds.filter((id) => id !== item.id) : [...activeIds, item.id];
      setInnerActiveIds(next);
      onActiveIdsChange?.(next);
    } else {
      setInnerValue(item.id);
      onValueChange?.(item.id);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (multi) return;
    const axis = variant === 'vertical' ? ['ArrowUp', 'ArrowDown'] : ['ArrowLeft', 'ArrowRight'];
    if (!['Home', 'End', ...axis].includes(event.key)) return; // Pfeile der anderen Achse bleiben unberührt
    const next = nextTab(index, event.key, items, { vertical: variant === 'vertical' });
    event.preventDefault();
    if (next === index) return;
    select(items[next]);
    buttons.current[next]?.focus();
  };

  return (
    <div
      className={cn('hoops-tabs', `hoops-tabs--${variant}`, `hoops-tabs--${size}`, className)}
      role={multi ? 'group' : 'tablist'}
      aria-label={ariaLabel ?? i18n.t('tabs.label')}
      lang={i18n.lang}
      aria-orientation={!multi && variant === 'vertical' ? 'vertical' : undefined}
    >
      {items.map((item, index) => {
        const active = isActive(item.id);
        return (
          <button
            key={item.id}
            ref={(el) => {
              buttons.current[index] = el;
            }}
            type="button"
            className={cn('hoops-tab', active && 'is-active', item.disabled && 'is-disabled')}
            role={multi ? undefined : 'tab'}
            aria-selected={multi ? undefined : active}
            aria-pressed={multi ? active : undefined}
            disabled={item.disabled}
            tabIndex={multi ? undefined : active ? 0 : -1}
            onClick={() => select(item)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {item.icon ? <Icon name={item.icon} size={16} className="hoops-tab-ic" /> : null}
            <span className="hoops-tab-label">{item.label}</span>
            {item.count !== undefined ? <span className="hoops-tab-count">{item.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
