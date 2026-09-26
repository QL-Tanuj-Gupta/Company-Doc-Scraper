import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo / App Name */}
        <Link to="/" className="text-lg font-semibold text-gray-900">
          Company Knowledge
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              isActive("/")
                ? "bg-black text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            Home
          </Link>

          <Link
            to="/add-project"
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              isActive("/add-project")
                ? "bg-black text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            Add Project
          </Link>

          <Link
            to="/chat"
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              isActive("/chat")
                ? "bg-black text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            Chat
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
