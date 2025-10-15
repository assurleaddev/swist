// File: frontend/components/Footer.tsx
import { SwissFlagIcon } from "./icons/SwissFlagIcon";

export default function Footer() {
    return (
        <footer className="w-full bg-gray-900/80 text-white backdrop-blur-sm mt-16 py-8">
            <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
                <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <SwissFlagIcon className="h-8 w-8" />
                        <span className="font-bold text-lg">swisstouristy</span>
                    </div>
                    <p className="text-gray-400">Swiss Made Experiences<br/>Powered by AI.</p>
                </div>

                <div>
                    <h4 className="font-bold mb-2">Quick Links</h4>
                    <ul className="space-y-1 text-gray-300">
                        <li><a href="#" className="hover:text-white">Experiences</a></li>
                        <li><a href="#" className="hover:text-white">Cars</a></li>
                        <li><a href="#" className="hover:text-white">Destinations</a></li>
                        <li><a href="#" className="hover:text-white">Concierge</a></li>
                    </ul>
                </div>

                 <div>
                    <h4 className="font-bold mb-2">Contact</h4>
                    <ul className="space-y-1 text-gray-300">
                        <li><a href="#" className="hover:text-white">concierge@swisstouristy.com</a></li>
                        <li><a href="#" className="hover:text-white">+41 44 123 4567</a></li>
                    </ul>
                </div>

                <div>
                    <p className="text-gray-400">&copy; {new Date().getFullYear()} SwissTouristy. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}

