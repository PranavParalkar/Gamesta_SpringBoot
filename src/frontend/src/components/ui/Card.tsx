import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
  gradient?: boolean;
  transparent?: boolean;
}

export function Card({ children, className = '', hover = false, gradient = false, transparent = false, ...props }: CardProps) {
  // new optional: props.borderless to remove borders
  const borderless = (props as any).borderless as boolean | undefined;
  const baseClasses = borderless ? 'rounded-xl bg-card text-card-foreground shadow-sm' : 'rounded-xl border border-border bg-card text-card-foreground shadow-sm';
  // translucent backdrop variant — subtle white tint + blur; borderless variant removes border
  const baseTransparent = borderless ? 'rounded-xl bg-white/5 backdrop-blur-sm text-card-foreground shadow-sm' : 'rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm text-card-foreground shadow-sm';
  const hoverClasses = hover ? 'hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer' : '';
  const gradientClasses = gradient ? 'bg-gradient-primary text-white border-transparent' : '';
  const appliedBase = transparent ? baseTransparent : baseClasses;
  return (
    <div className={`${appliedBase} ${hoverClasses} ${gradientClasses} ${className}`} {...props}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
      {children}
    </h3>
  );
}

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardDescription({ children, className = '' }: CardDescriptionProps) {
  return (
    <p className={`text-sm text-muted-foreground ${className}`}>
      {children}
    </p>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={`p-6 pt-0 ${className}`}>
      {children}
    </div>
  );
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`flex items-center p-6 pt-0 ${className}`}>
      {children}
    </div>
  );
}
