import test from "node:test";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>{
  children: string;
  icon?: React.ReactNode;
  className?: string;
}

export default function Button({ children, icon, className, ...rest}: ButtonProps) {
  return (
    <button
      className={`flex w-full items-center justify-center rounded-full border border-gray-400 px-4 py-2 transition-colors hover:bg-white`}
      {...rest}
    >
      {icon && <span className="px-2">{icon}</span>}
      <span className={className}>{children}</span>
    </button>
  );
}