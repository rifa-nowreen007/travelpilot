import { motion } from 'framer-motion';

export default function StatCard({ icon: Icon, label, value, sub, color = 'teal', delay = 0 }) {
  const colorMap = {
    teal: 'bg-teal-500/10 text-teal-500',
    sunset: 'bg-sunset-500/10 text-sunset-500',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="card p-6"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${colorMap[color] || colorMap.teal}`}>
        <Icon className="text-xl" />
      </div>
      <p className="text-2xl font-display font-bold">{value}</p>
      <p className="text-xs text-midnight-900/50 dark:text-white/50 mt-1">{label}</p>
      {sub && <p className="text-[11px] text-teal-600 dark:text-teal-400 mt-2 font-medium">{sub}</p>}
    </motion.div>
  );
}
