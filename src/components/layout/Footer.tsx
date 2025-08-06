import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-950 py-12 border-t border-gray-800">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Repur.fi</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Kestävää ja luotettavaa suorituskykyä - uudelleenkäytetyt premium-pelikoneet.
            </p>
          </div>

          {/* Tuotteet */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Tuotteet</h3>
            <ul className="space-y-2">
              <li><Link href="/osta" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">Osta</Link></li>
              <li><Link href="/myy" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">Myy Koneesi</Link></li>

            </ul>
          </div>

          {/* Tuki */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Tuki</h3>
            <ul className="space-y-2">
              <li><Link href="/tuki" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">Asiakastuki</Link></li>
              <li><Link href="/takuu" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">Takuu</Link></li>
              <li><Link href="/yhteystiedot" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">Yhteystiedot</Link></li>
            </ul>
          </div>

          {/* Yritys */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Yritys</h3>
            <ul className="space-y-2">
              <li><Link href="/meista" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">Meistä</Link></li>
            </ul>
          </div>
        </div>

        {/* Sosiaalinen media ja Tekijänoikeudet */}
        <div className="mt-12 pt-8 border-t dark:border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            © {new Date().getFullYear()} Repur.fi. Kaikki oikeudet pidätetään.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">
              <Facebook className="h-5 w-5" />
            </Link>
            <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">
              <Twitter className="h-5 w-5" />
            </Link>
            <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">
              <Instagram className="h-5 w-5" />
            </Link>
            <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">
              <Linkedin className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}