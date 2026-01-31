'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/language-context';

const ELLIPSE_8 = encodeURI('/icons/Ellipse 8.png');

interface OverviewProps {
    onSuggestedQueryClick?: (query: string) => void;
}

export const Overview = ({ onSuggestedQueryClick }: Readonly<OverviewProps>) => {
    const { t } = useLanguage();

    const suggestedQueries = [
        t('suggestedQuery1'),
        t('suggestedQuery2'),
        t('suggestedQuery3'),
    ] as const;

    return (
        <motion.div
            key="overview"
            className="w-full flex-1 flex flex-col justify-center items-center px-4 py-6 md:py-10"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ delay: 0.3 }}
        >
            {/* رسم زخرفي كبير - ألوان بنفسجي/أزرق/أبيض من public/icons */}
            <div className="relative flex justify-center items-center w-full max-w-md mx-auto mb-6 md:mb-8">
                <div className="w-56 h-56 md:w-72 md:h-72 opacity-30 md:opacity-40">
                    <Image
                        src={ELLIPSE_8}
                        alt=""
                        width={288}
                        height={288}
                        className="w-full h-full object-contain"
                        unoptimized
                    />
                </div>
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground text-center mb-3">
                {t('welcomeTitle')}
            </h1>
            <p className="text-muted-foreground text-sm md:text-base text-center max-w-lg mb-8">
                {t('welcomeSubtitle')}
            </p>

            {/* أزرار أسئلة مقترحة - حجم ديناميكي حسب النص، تنسيق موحد */}
            <div className="flex flex-wrap justify-center gap-[10px] w-full max-w-3xl">
                {suggestedQueries.map((query) => (
                    <motion.button
                        key={query}
                        type="button"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        onClick={() => onSuggestedQueryClick?.(query)}
                        className="
                          min-h-[56px] w-fit max-w-full
                          pt-4 pb-4 pl-3 pr-3
                          gap-2.5
                          rounded-tl-[24px] rounded-tr-[0] rounded-br-[24px] rounded-bl-[24px]
                          bg-muted/80 hover:bg-muted border border-border/60
                          text-sm text-muted-foreground hover:text-foreground
                          text-center transition-colors
                          opacity-100
                        "
                    >
                        {query}
                    </motion.button>
                ))}
            </div>
        </motion.div>
    );
};
