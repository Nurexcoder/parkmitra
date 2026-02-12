export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="text-center text-white px-4">
        <div className="text-6xl md:text-8xl mb-6">🅿️</div>
        <h1 className="text-3xl md:text-5xl font-bold mb-4">ParkMitra</h1>
        <p className="text-lg md:text-xl text-purple-100 mb-8">Smart Parking Management System</p>
        <a
          href="/login"
          className="inline-block w-full md:w-auto bg-white text-purple-600 py-3 px-8 rounded-lg font-semibold hover:bg-purple-50 transition-all shadow-lg text-lg"
        >
          Admin Login →
        </a>
      </div>
    </div>
  );
}
