import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'amber' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

const variants = {
  primary: 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md hover:shadow-lg',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  success: 'bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-md',
  danger: 'bg-gradient-to-r from-rose-400 to-red-500 text-white shadow-md',
  amber: 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md',
  ghost: 'text-purple-600 hover:bg-purple-50',
};

const sizes = {
  sm: 'py-2 px-4 text-sm rounded-xl',
  md: 'py-3 px-6 text-base rounded-xl',
  lg: 'py-4 px-8 text-lg rounded-2xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  loading,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        'font-bold active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2',
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
