import { Link } from "react-router-dom";

const Home = () => {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            Company Knowledge
          </h1>

          <p className="mt-3 text-lg text-gray-600">
            Manage your company projects and explore knowledge with AI.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Link
            to="/add-project"
            className="group rounded-2xl border border-gray-200 bg-white p-8 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100">
              <span className="text-3xl text-blue-600">+</span>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900">
              Add Project
            </h2>

            <p className="mt-3 text-gray-600">
              Add a new company project with its overview, technologies, team
              members, and features.
            </p>

            <div className="mt-6 font-medium text-blue-600">
              Add a project →
            </div>
          </Link>

          <Link
            to="/chat"
            className="group rounded-2xl border border-gray-200 bg-white p-8 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-purple-100">
              <span className="text-2xl text-purple-600">💬</span>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900">Chat</h2>

            <p className="mt-3 text-gray-600">
              Ask questions about company projects, technologies, teams,
              features, and more.
            </p>

            <div className="mt-6 font-medium text-purple-600">
              Start chatting →
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
};

export default Home;
