import type { ReactNode } from 'react';
import { Text, View, type ViewProps } from 'react-native';

type DashboardCardProps = ViewProps & {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
};

export function DashboardCard({
  title,
  subtitle,
  children,
  className = '',
  ...props
}: DashboardCardProps) {
  return (
    <View
      className={`rounded-3xl border border-anime-border bg-white/5 p-5 ${className}`}
      {...props}
    >
      {title ? (
        <Text className="text-lg font-semibold text-white">{title}</Text>
      ) : null}
      {subtitle ? (
        <Text className="mt-1 text-sm leading-5 text-anime-mute">{subtitle}</Text>
      ) : null}
      {children ? <View className={title || subtitle ? 'mt-4' : ''}>{children}</View> : null}
    </View>
  );
}
