// src/components/Footer.tsx

export default function Footer() {
  return (
    <footer className="bg-white border-t mt-12">
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Heather Glen Village. All rights reserved.</p>
        <div className="mt-2 sm:mt-0 space-x-4">
          <a href="/privacy" className="hover:text-blue-600 transition">
            Privacy Policy
          </a>
          <a href="/terms" className="hover:text-blue-600 transition">
            Terms of Service
          </a>
          <a href="/contact" className="hover:text-blue-600 transition">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
