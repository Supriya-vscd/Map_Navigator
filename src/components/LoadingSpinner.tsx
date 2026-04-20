interface Props {
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

const sizeMap = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-[3px]',
}

export default function LoadingSpinner({ size = 'md', label }: Props) {
  return (
    <div className="flex items-center justify-center gap-2" role="status" aria-label={label ?? 'Loading'}>
      <div
        className={`${sizeMap[size]} rounded-full border-brand-600 border-t-transparent animate-spin`}
      />
      {label && <span className="text-sm text-slate-400">{label}</span>}
    </div>
  )
}
