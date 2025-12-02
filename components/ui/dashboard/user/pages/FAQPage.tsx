
import React, { useState } from 'react';
import Card from '../../../../ui/Card';
import { ICONS } from '../../../../../constants';
import { TRANSLATIONS } from '../../../../../lib/translations';
import type { Language } from '../../../../../types';

interface FAQPageProps {
    language: Language;
}

const FAQPage: React.FC<FAQPageProps> = ({ language }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const t = TRANSLATIONS[language] || TRANSLATIONS['pt'];

    return (
        <div className="space-y-8 animate-fade-in p-4 sm:p-0">
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
            `}</style>
            
            <div className="flex items-center gap-3">
                <div className="p-3 bg-brand-green/10 rounded-xl text-brand-green">
                    {ICONS.question}
                </div>
                <div>
                    <h1 className="text-3xl font-bold">{t.faq_menu}</h1>
                    <p className="text-gray-400">Tire suas dúvidas sobre a plataforma e seus investimentos.</p>
                </div>
            </div>

            <Card className="border-gray-800 bg-brand-black/50">
                <div className="space-y-4">
                    {t.faq.map((item, index) => (
                        <div key={index} className="border border-gray-800 rounded-xl bg-brand-black overflow-hidden transition-all duration-300 hover:border-gray-700">
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full flex justify-between items-center p-5 text-left hover:bg-gray-800/50 transition-colors"
                            >
                                <span className="font-bold text-white text-base md:text-lg pr-4">{item.q}</span>
                                <span className={`transform transition-transform duration-300 text-brand-green flex-shrink-0 ${openIndex === index ? 'rotate-180' : ''}`}>
                                    {ICONS.arrowDown}
                                </span>
                            </button>
                            {openIndex === index && (
                                <div className="p-5 pt-0 text-gray-400 text-sm md:text-base leading-relaxed border-t border-gray-800/50 mt-2 animate-fade-in">
                                    {item.a}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                
                <div className="mt-8 p-6 bg-brand-blue/10 border border-brand-blue/20 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h4 className="text-brand-blue font-bold text-lg mb-1">Ainda tem dúvidas?</h4>
                        <p className="text-sm text-gray-300">Nossa equipe de suporte está pronta para te atender.</p>
                    </div>
                    <div className="flex items-center gap-2 text-brand-blue font-bold bg-brand-blue/10 px-4 py-2 rounded-lg">
                        {ICONS.support}
                        <span>Fale no Chat</span>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default FAQPage;
