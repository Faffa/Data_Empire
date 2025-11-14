function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-blue-400 mb-2">
            Data Empire
          </h1>
          <p className="text-slate-400">
            Build and optimize your data infrastructure empire
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Dashboard Card */}
          <div className="bg-slate-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Data Credits:</span>
                <span className="font-mono text-green-400">0 DC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Global SLA:</span>
                <span className="font-mono text-blue-400">100%</span>
              </div>
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-slate-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Status</h2>
            <div className="text-sm text-slate-400">
              <p>✅ Phase 1: Setup Complete</p>
              <p>🚧 Phase 2: Game Engine (Next)</p>
            </div>
          </div>

          {/* Quick Start Card */}
          <div className="bg-slate-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Quick Start</h2>
            <div className="text-sm text-slate-400 space-y-1">
              <p>📚 Check ../todo.md</p>
              <p>📖 Read .context/architecture</p>
              <p>🎮 Ready to build!</p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-slate-800 rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-3">Development Environment Ready</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-center">
              <span className="text-green-400 mr-2">✓</span>
              React 18 + TypeScript + Vite
            </li>
            <li className="flex items-center">
              <span className="text-green-400 mr-2">✓</span>
              Zustand State Management
            </li>
            <li className="flex items-center">
              <span className="text-green-400 mr-2">✓</span>
              Tailwind CSS Styling
            </li>
            <li className="flex items-center">
              <span className="text-green-400 mr-2">✓</span>
              Vitest Testing (2 tests passing)
            </li>
            <li className="flex items-center">
              <span className="text-green-400 mr-2">✓</span>
              Git + GitHub Connected
            </li>
          </ul>
        </div>

        <footer className="mt-8 text-center text-slate-500 text-sm">
          <p>Phase 1 Complete • Ready for Phase 2: Game Engine Development</p>
        </footer>
      </div>
    </div>
  )
}

export default App
