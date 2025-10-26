// import { useState } from 'react';
// import { Menu, X, Thermometer, Gauge, CloudRain, Anchor, LogOut } from 'lucide-react';

// export default function ControlPanel() {
//   const [isOpen, setIsOpen] = useState(false);
//   const [showTemperature, setShowTemperature] = useState(true);
//   const [showPressure, setShowPressure] = useState(false);
//   const [showStorm, setShowStorm] = useState(false);
//   const [showPorts, setShowPorts] = useState(true);

//   const toggleMenu = () => setIsOpen(!isOpen);

//   const menuItems = [
//     {
//       id: 'temperature',
//       icon: <Thermometer className="w-5 h-5" />,
//       label: 'Temperature',
//       active: showTemperature,
//       toggle: () => setShowTemperature(!showTemperature),
//       gradient: 'from-red-500 to-orange-500'
//     },
//     {
//       id: 'pressure',
//       icon: <Gauge className="w-5 h-5" />,
//       label: 'Pressure',
//       active: showPressure,
//       toggle: () => setShowPressure(!showPressure),
//       gradient: 'from-purple-500 to-pink-500'
//     },
//     {
//       id: 'storm',
//       icon: <CloudRain className="w-5 h-5" />,
//       label: 'Storm Layers',
//       active: showStorm,
//       toggle: () => setShowStorm(!showStorm),
//       gradient: 'from-indigo-500 to-blue-500'
//     },
//     {
//       id: 'ports',
//       icon: <Anchor className="w-5 h-5" />,
//       label: 'Ports',
//       active: showPorts,
//       toggle: () => setShowPorts(!showPorts),
//       gradient: 'from-green-500 to-emerald-500'
//     }
//   ];

//   return (
//     <div className="fixed top-24 right-5 z-[1000]">
//       {/* Burger Button */}
//       <button
//         onClick={toggleMenu}
//         className="relative flex items-center justify-center w-14 h-14 text-white transition-all duration-300 border rounded-full shadow-xl bg-gradient-to-br from-blue-600 to-purple-600 border-blue-400/30 backdrop-blur-sm hover:scale-110 hover:shadow-2xl group"
//       >
//         <div className="relative">
//           {isOpen ? (
//             <X className="w-6 h-6 transition-transform duration-300 rotate-90" />
//           ) : (
//             <Menu className="w-6 h-6 transition-transform duration-300" />
//           )}
//         </div>
        
//         {/* Pulse animation when closed */}
//         {!isOpen && (
//           <div className="absolute inset-0 rounded-full opacity-75 animate-ping bg-blue-400/50"></div>
//         )}
//       </button>

//       {/* Slide-out Menu */}
//       <div
//         className={`absolute right-0 top-16 w-72 transition-all duration-300 ease-out transform ${
//           isOpen
//             ? 'translate-x-0 opacity-100'
//             : 'translate-x-[120%] opacity-0 pointer-events-none'
//         }`}
//       >
//         <div className="p-5 border shadow-2xl bg-gradient-to-br from-slate-900/95 via-blue-900/80 to-purple-900/85 rounded-2xl border-blue-500/20 backdrop-blur-xl">
//           {/* Header */}
//           <div className="pb-4 mb-4 border-b border-blue-400/20">
//             <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
//               Map Controls
//             </h3>
//             <p className="mt-1 text-xs text-blue-200/60">Toggle layers and options</p>
//           </div>

//           {/* Menu Items */}
//           <div className="space-y-3">
//             {menuItems.map((item, index) => (
//               <button
//                 key={item.id}
//                 onClick={item.toggle}
//                 style={{
//                   animationDelay: `${index * 50}ms`
//                 }}
//                 className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all duration-200 border group hover:scale-[1.02] animate-slideIn ${
//                   item.active
//                     ? `bg-gradient-to-r ${item.gradient} border-white/20 text-white shadow-lg`
//                     : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:border-slate-600/50'
//                 }`}
//               >
//                 <div className="flex items-center gap-3">
//                   <div className={`${item.active ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>
//                     {item.icon}
//                   </div>
//                   <span className="text-sm">{item.label}</span>
//                 </div>
                
//                 {/* Toggle Indicator */}
//                 <div className={`w-10 h-5 rounded-full transition-all duration-200 ${
//                   item.active ? 'bg-white/30' : 'bg-slate-600/50'
//                 }`}>
//                   <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-all duration-200 transform ${
//                     item.active ? 'translate-x-5 mt-0.5' : 'translate-x-0.5 mt-0.5'
//                   }`}></div>
//                 </div>
//               </button>
//             ))}

//             {/* Divider */}
//             <div className="py-2">
//               <div className="border-t border-blue-400/10"></div>
//             </div>

//             {/* Logout Button */}
//             <button
//               onClick={() => console.log('Logout')}
//               className="flex items-center justify-center w-full gap-2 px-4 py-3 font-medium text-white transition-all duration-200 border rounded-xl bg-gradient-to-r from-slate-700 to-slate-800 border-slate-600/50 hover:from-slate-600 hover:to-slate-700 hover:scale-[1.02] hover:shadow-lg group"
//             >
//               <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
//               <span className="text-sm">Account Logout</span>
//             </button>
//           </div>

//           {/* Footer Stats */}
//           <div className="grid grid-cols-2 gap-2 pt-4 mt-4 border-t border-blue-400/10">
//             <div className="px-3 py-2 text-center rounded-lg bg-blue-500/10">
//               <div className="text-xs text-blue-300/60">Active Layers</div>
//               <div className="text-lg font-bold text-blue-400">
//                 {menuItems.filter(item => item.active).length}
//               </div>
//             </div>
//             <div className="px-3 py-2 text-center rounded-lg bg-purple-500/10">
//               <div className="text-xs text-purple-300/60">Total Layers</div>
//               <div className="text-lg font-bold text-purple-400">
//                 {menuItems.length}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Backdrop */}
//       {isOpen && (
//         <div
//           onClick={toggleMenu}
//           className="fixed inset-0 -z-10 bg-black/20 backdrop-blur-sm animate-fadeIn"
//         ></div>
//       )}

//       <style>{`
//         @keyframes slideIn {
//           from {
//             opacity: 0;
//             transform: translateX(20px);
//           }
//           to {
//             opacity: 1;
//             transform: translateX(0);
//           }
//         }
        
//         @keyframes fadeIn {
//           from {
//             opacity: 0;
//           }
//           to {
//             opacity: 1;
//           }
//         }

//         .animate-slideIn {
//           animation: slideIn 0.3s ease-out forwards;
//         }

//         .animate-fadeIn {
//           animation: fadeIn 0.2s ease-out;
//         }
//       `}</style>
//     </div>
//   );
// }