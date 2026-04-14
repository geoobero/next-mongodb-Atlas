export default function About() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-900 relative overflow-hidden">
      {/* Blurred Background Shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl bg-blue-500/20"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl bg-purple-500/20"></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">About EduHub</h1>
          <p className="text-lg text-white/60">
            Empowering educational institutions with modern technology
          </p>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Our Mission</h2>
          <p className="text-white/60 leading-relaxed mb-6">
            EduHub is a comprehensive student management system designed to simplify
            the way educational institutions manage their student data. We believe
            in creating tools that are both powerful and easy to use.
          </p>
          <p className="text-white/60 leading-relaxed">
            Built with Next.js and MongoDB, our platform offers fast performance,
            secure data storage, and a beautiful user interface that makes managing
            students a breeze.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <h3 className="text-2xl font-semibold text-white mb-4">Tech Stack</h3>
            <ul className="space-y-3">
              {["Next.js 16", "React 19", "Tailwind CSS 4", "MongoDB Atlas", "JWT Auth"].map((tech, idx) => (
                <li key={idx} className="flex items-center text-white/70">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                  {tech}
                </li>
              ))}
            </ul>
          </div>

          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
            <h3 className="text-2xl font-semibold text-white mb-4">Features</h3>
            <ul className="space-y-3">
              {[
                "Complete CRUD Operations",
                "Responsive Design",
                "Modern UI/UX",
                "Real-time Updates",
                "Secure Authentication",
              ].map((feature, idx) => (
                <li key={idx} className="flex items-center text-white/70">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
