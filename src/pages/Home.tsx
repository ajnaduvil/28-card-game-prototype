import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 p-6 flex flex-col items-center justify-center">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute opacity-10 -top-64 -right-64 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 blur-3xl"></div>
        <div className="absolute opacity-10 -bottom-64 -left-64 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 blur-3xl"></div>
      </div>

      <div className="relative z-10 bg-slate-800 rounded-xl shadow-2xl p-10 w-full max-w-lg border border-slate-700">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-3">
            28 Card Game
          </h1>
          <p className="text-slate-300 text-lg">
            A traditional trick-taking card game from Kerala, South India
          </p>
        </div>

        {/* Card suits decoration */}
        <div className="flex justify-center gap-6 mb-8">
          <span className="text-4xl text-red-500">♥</span>
          <span className="text-4xl text-red-500">♦</span>
          <span className="text-4xl text-slate-200">♣</span>
          <span className="text-4xl text-slate-200">♠</span>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => navigate("/setup")}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-4 rounded-lg font-medium transition-all duration-200 shadow-lg transform hover:scale-[1.02]"
          >
            New Game
          </button>

          {/* Phase 2 features */}
          <button
            disabled
            className="w-full bg-slate-700 text-slate-400 py-4 rounded-lg font-medium border border-slate-600"
          >
            Online Mode (Coming Soon)
          </button>

          <button
            disabled
            className="w-full bg-slate-700 text-slate-400 py-4 rounded-lg font-medium border border-slate-600"
          >
            Rules (Coming Soon)
          </button>
        </div>

        <div className="mt-8 text-center text-slate-500 text-sm">
          <p>Version 1.0 | Developed with ♥</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
