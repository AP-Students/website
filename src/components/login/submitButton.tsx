interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>{
  children: string;
  icon?: React.ReactNode;
  className?: string;
  execute?: (...args: any[]) => void | Promise<void>;
}

export default function Button({ children, icon, className, execute, type }: ButtonProps) {
  return (
    <button
      onClick={execute}
      type={type}
      className={`flex w-full items-center justify-center rounded-full border border-gray-400 px-4 py-2 transition-colors hover:bg-primary-foreground`}
    >
      {icon && <span className="px-2">{icon}</span>}
      <span className={className}>{children}</span>
    </button>
  );
}