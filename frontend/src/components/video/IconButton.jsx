import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";

/**
 * Utility to merge tailwind classes safely
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function IconButton({
    icon: Icon,
    onClick,
    active = false,
    danger = false,
    className = "",
    label = ""
}) {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={cn(
                "relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900",
                active
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 backdrop-blur-md",
                danger && "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/30",
                className
            )}
            title={label}
        >
            <Icon className="h-5 w-5" />
            {label && <span className="sr-only">{label}</span>}
        </motion.button>
    );
}
