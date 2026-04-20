import { RouteResult, formatDistance, formatDuration, maneuverIcon } from '../api/mapApi'

interface Props {
  route: RouteResult
  onClear: () => void
}

export default function RouteInfo({ route, onClear }: Props) {
  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">
      {/* Summary bar */}
      <div className="glass-card p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">
              {formatDuration(route.duration_s)}
            </p>
            <p className="text-xs text-slate-400 uppercase tracking-wider">ETA</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <p className="text-2xl font-bold text-brand-400">
              {formatDistance(route.distance_m)}
            </p>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Distance</p>
          </div>
        </div>

        <button
          onClick={onClear}
          className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs font-medium px-3 py-1.5 rounded-lg"
          aria-label="Clear route"
        >
          ✕ Clear
        </button>
      </div>

      {/* Step-by-step directions */}
      <div className="glass-card overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-200">Turn-by-Turn Directions</span>
          <span className="ml-auto text-xs text-slate-500">{route.steps.length} steps</span>
        </div>
        <ul className="divide-y divide-white/5 max-h-56 overflow-y-auto">
          {route.steps.map((step, i) => (
            <li
              key={i}
              className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
            >
              <span className="text-lg leading-none mt-0.5 shrink-0" aria-hidden>
                {maneuverIcon(step.instruction, step.modifier)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 capitalize truncate">
                  {step.instruction.replace(/-/g, ' ')}
                  {step.name ? ` onto ${step.name}` : ''}
                </p>
                {step.modifier && (
                  <p className="text-xs text-slate-500 capitalize">{step.modifier}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-medium text-slate-300">{formatDistance(step.distance_m)}</p>
                <p className="text-xs text-slate-500">{formatDuration(step.duration_s)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
