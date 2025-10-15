// Landing page for Patrick Travel Services

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Patrick Travel Services
        </h1>
        <p className="text-center text-lg mb-8">
          Welcome to your comprehensive immigration services management platform
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">For Agents</h2>
            <p className="mb-4">
              Access the back-office management system to handle cases, clients, and documents.
            </p>
            <a
              href="/auth/login"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Agent Login
            </a>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">For Clients</h2>
            <p className="mb-4">
              Download our mobile app to submit cases, track progress, and communicate with your advisor.
            </p>
            <div className="flex gap-4">
              <button className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900">
                App Store
              </button>
              <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Play Store
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
