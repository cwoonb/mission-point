import { clsx } from 'clsx';
import { playSound } from '../../utils/sound';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'amber' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

const variants = {
  primary: 'bg-[#14233B] text-white hover:bg-[#0D192B]',
  secondary: 'border border-[#14233B] bg-transparent text-[#14233B] hover:bg-[#E9EDF2]',
  success: 'bg-[#4F8A68] text-white hover:bg-[#417559]',
  danger: 'border border-[#DFB9B5] bg-[#FFF8F7] text-[#B35F5A] hover:bg-[#FBECEB]',
  amber: 'bg-[#B58A4A] text-white hover:bg-[#9D753D]',
  ghost: 'text-[#14233B] hover:bg-[#E9EDF2]',
};

const sizes = {
  sm: 'min-h-10 py-2 px-4 text-sm rounded-[10px]',
  md: 'min-h-11 py-3 px-6 text-sm rounded-[10px]',
  lg: 'min-h-12 py-3.5 px-8 text-base rounded-[10px]',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  loading,
  disabled,
  className,
  children,
  onClick,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      onClick={(e) => {
        playSound('tap');
        onClick?.(e);
      }}
      className={clsx(
        'font-bold active:scale-[0.98] transition-colors duration-150 ease-out disabled:opacity-45 disabled:cursor-not-allowed flex items-center justify-center gap-2',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
