
import React, { useState } from 'react';
import type { User, Language } from '../../../../../types';
import Card from '../../../../ui/Card';
import Input from '../../../../ui/Input';
import Button from '../../../../ui/Button';
import { ICONS } from '../../../../../constants';
import { TRANSLATIONS } from '../../../../../lib/translations';

interface DeleteAccountPageProps {
    user: User;
    language: Language;
    onDeleteAccount: (userId: string, password: string, isSelfDelete: boolean) => Promise<{ success: boolean; message?: string }>;
}

const DeleteAccountPage: React.FC<DeleteAccountPageProps> = ({ user, language, onDeleteAccount }) => {
    const [confirmName, setConfirmName] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // FIX: Corrected translation key access.
    const t = TRANSLATIONS[language]?.delete_account || TRANSLATIONS['pt'].delete_account;
    const isButtonDisabled = confirmName.trim().toLowerCase() !== user.name.trim().toLowerCase() || password.length < 1 || isLoading;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isButtonDisabled) return;

        setIsLoading(true);
        setError(null);

        const result = await onDeleteAccount(user.id, password, true);

        if (!result.success) {
            setError(result.message || 'Ocorreu um erro desconhecido.');
            setIsLoading(false);
        }
        // On success, App.tsx will handle logout and view change.
    };

    return (
        <div className="space-y-8 animate-fade-in p-4 sm:p-0 max-w-3xl mx-auto">
            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
            `}</style>

            <div>
                <h1 className="text-3xl font-bold">{t.title}</h1>
                <p className="text-gray-400">{t.subtitle}</p>
            </div>

            <Card className="border-red-500/30 bg-red-500/5">
                <div className="flex gap-4">
                    <div className="text-red-400 mt-1">
                        {React.cloneElement(ICONS.alert as React.ReactElement, { className: 'w-8 h-8' })}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-red-400">{t.warning_title}</h2>
                        <p className="text-gray-300 mt-2">{t.warning_1}</p>
                        <p className="text-gray-400 mt-2">{t.warning_2}</p>
                    </div>
                </div>
            </Card>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        label={t.confirm_label}
                        id="confirmName"
                        value={confirmName}
                        onChange={(e) => setConfirmName(e.target.value)}
                        placeholder={t.confirm_placeholder}
                        required
                    />
                    <Input
                        label={t.password_label}
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />

                    {error && (
                        <p className="text-red-400 text-sm text-center bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                            {error}
                        </p>
                    )}

                    <div className="pt-4">
                        <Button
                            type="submit"
                            fullWidth
                            disabled={isButtonDisabled}
                            isLoading={isLoading}
                            className={`
                                ${isButtonDisabled
                                ? 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed'
                                : 'bg-red-600 border-red-500 text-white hover:bg-red-700 shadow-lg shadow-red-500/20'}
                            `}
                        >
                            {t.button_text}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default DeleteAccountPage;