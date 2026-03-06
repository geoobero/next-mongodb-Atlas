export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-800 mb-4">About EduHub</h1>
        <p className="text-lg text-slate-600">
          Empowering educational institutions with modern technology
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
        <h2 className="text-2xl font-semibold text-slate-800 mb-4">Our Mission</h2>
        <p className="text-slate-600 leading-relaxed mb-6">
          EduHub is a comprehensive student management system designed to simplify
          the way educational institutions manage their student data. We believe
          in creating tools that are both powerful and easy to use.
        </p>
        <p className="text-slate-600 leading-relaxed">
          Built with Next.js and MongoDB, our platform offers fast performance,
          secure data storage, and a beautiful user interface that makes managing
          students a breeze.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-semibold mb-4">Tech Stack</h3>
          <ul className="space-y-2">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-white/80 rounded-full mr-3"></span>
              Next.js 16
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-white/80 rounded-full mr-3"></span>
              React 19
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-white/80 rounded-full mr-3"></span>
              Tailwind CSS 4
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-white/80 rounded-full mr-3"></span>
              MongoDB Atlas
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-white/80 rounded-full mr-3"></span>
              Express.js
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <h3 className="text-2xl font-semibold text-slate-800 mb-4">Features</h3>
          <ul className="space-y-3">
            {[
              "Complete CRUD Operations",
              "Responsive Design",
              "Modern UI/UX",
              "Real-time Updates",
              "Secure Authentication",
            ].map((feature, idx) => (
              <li key={idx} className="flex items-center text-slate-600">
                <svg
                  className="w-5 h-5 text-green-500 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
