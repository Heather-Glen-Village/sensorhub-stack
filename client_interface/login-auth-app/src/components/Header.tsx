// src/components/Header.tsx

export default function Header() {
  return (
    <header className="bg-white shadow-md p-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Heather Glen Village
        </h1>
        <nav className="space-x-4">
          <a href="/" className="text-gray-600 hover:text-blue-600 transition">
            Home
          </a>
          <a href="/dashboard" className="text-gray-600 hover:text-blue-600 transition">
            Dashboard
          </a>
          <a href="/staff/masterscreen" className="text-gray-600 hover:text-blue-600 transition">
            Admin
          </a>
          <a href="/login" className="text-gray-600 hover:text-blue-600 transition">
            Login
          </a>
        </nav>
      </div>
    </header>
  );
}
