import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'amber' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

const variants = {
  primary: 'glossy bg-gradient-to-b from-purple-400 to-indigo-500 text-white shadow-md hover:shadow-lg',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  success: 'glossy bg-gradient-to-b from-emerald-400 to-green-500 text-white shadow-md',
  danger: 'glossy bg-gradient-to-b from-rose-400 to-red-500 text-white shadow-md',
  amber: 'glossy bg-gradient-to-b from-amber-400 to-orange-400 text-white shadow-md',
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
        'font-bold active:scale-90 transition-all duration-100 ease-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2',
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
