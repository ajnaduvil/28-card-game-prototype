import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 text-white p-6 flex flex-col items-center justify-center">
      <div className="bg-white text-gray-800 rounded-lg shadow-xl p-8 w-full max-w-lg">
        <h1 className="text-4xl font-bold text-center mb-6">28 Card Game</h1>
        <p className="text-center mb-8">
          A traditional trick-taking card game from Kerala, South India
        </p>

        <div className="space-y-4">
          <button
            onClick={() => navigate("/setup")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md font-medium"
          >
            New Game
          </button>

          {/* Phase 2 features */}
          <button
            disabled
            className="w-full bg-gray-400 cursor-not-allowed text-white py-3 rounded-md font-medium"
          >
            Online Mode (Coming Soon)
          </button>

          <button
            disabled
            className="w-full bg-gray-400 cursor-not-allowed text-white py-3 rounded-md font-medium"
          >
            Rules (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
