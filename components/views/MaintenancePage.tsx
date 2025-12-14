
import React, { useState, useEffect } from 'react';
import { ICONS } from '../../constants';

interface MaintenancePageProps {
    endTime?: string;
}

const MaintenancePage: React.FC<MaintenancePageProps> = ({ endTime }) => {
    const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({ hours: 7, minutes: 0, seconds: 0 });

    useEffect(() => {
        if (!endTime) return;

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const end = new Date(endTime).getTime();
            const distance = end - now;

            if (distance < 0) {
                clearInterval(interval);
                setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
            } else {
                setTimeLeft({
                    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((distance % (1000 * 60)) / 1000),
                });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [endTime]);

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-green/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-brand-blue/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="relative z-10 max-w-2xl w-full text-center space-y-8">
                <div className="flex justify-center mb-6">
                    <div className="bg-brand-gray p-6 rounded-2xl border border-gray-800 shadow-2xl shadow-brand-green/10 relative">
                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-500 rounded-full animate-ping"></div>
                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-500 rounded-full"></div>
                        {React.cloneElement(ICONS.adminSettings as React.ReactElement<any>, { className: "w-16 h-16 text-brand-green" })}
                    </div>
                </div>

                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                        Plataforma em <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-brand-blue">Manutenção</span>
                    </h1>
                    <p className="text-gray-400 text-lg md:text-xl leading-relaxed">
                        Estamos atualizando nossos sistemas para garantir mais segurança e performance para seus investimentos.
                    </p>
                </div>

                <div className="bg-brand-gray/50 backdrop-blur-md border border-gray-800 rounded-2xl p-8">
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">Previsão de Retorno</p>
                    
                    <div className="flex justify-center items-center gap-4 md:gap-8 text-white">
                        <div className="flex flex-col items-center">
                            <div className="text-4xl md:text-6xl font-black font-mono bg-black/50 border border-gray-700 rounded-lg p-4 min-w-[80px] md:min-w-[100px]">
                                {String(timeLeft.hours).padStart(2, '0')}
                            </div>
                            <span className="text-xs text-gray-500 mt-2 font-bold uppercase">Horas</span>
                        </div>
                        <div className="text-2xl md:text-4xl font-bold text-gray-600 mb-6">:</div>
                        <div className="flex flex-col items-center">
                            <div className="text-4xl md:text-6xl font-black font-mono bg-black/50 border border-gray-700 rounded-lg p-4 min-w-[80px] md:min-w-[100px]">
                                {String(timeLeft.minutes).padStart(2, '0')}
                            </div>
                            <span className="text-xs text-gray-500 mt-2 font-bold uppercase">Minutos</span>
                        </div>
                        <div className="text-2xl md:text-4xl font-bold text-gray-600 mb-6">:</div>
                        <div className="flex flex-col items-center">
                            <div className="text-4xl md:text-6xl font-black font-mono bg-black/50 border border-gray-700 rounded-lg p-4 min-w-[80px] md:min-w-[100px] text-brand-green">
                                {String(timeLeft.seconds).padStart(2, '0')}
                            </div>
                            <span className="text-xs text-gray-500 mt-2 font-bold uppercase">Segundos</span>
                        </div>
                    </div>
                </div>

                <div className="text-sm text-gray-500">
                    <p>Agradecemos a compreensão.</p>
                    <p>Equipe GreennSeven Invest</p>
                </div>
                
                <div className="pt-8">
                    <button 
                        onClick={() => window.location.reload()} 
                        className="text-brand-green hover:text-white transition-colors text-sm font-medium flex items-center justify-center gap-2 mx-auto"
                    >
                        {ICONS.refresh} Tentar Reconectar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MaintenancePage;
