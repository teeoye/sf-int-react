'use client';

import cx from 'classnames';
import {
    useRef,
    useEffect,
    useCallback,
} from 'react';
import { toast } from 'sonner';
import { useWindowSize } from 'usehooks-ts';

import { Textarea } from './ui/textarea';
import { PlusIcon } from './icons';
import { useLanguage } from '../context/language-context';

function MicIcon({ className }: Readonly<{ className?: string }>) {
    return (
        <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
    );
}

export const ChatInput = ({
    isLoading,
    handleSubmit,
    className,
}: Readonly<{
    isLoading: boolean;
    handleSubmit: (input: string) => void;
    className?: string;
}>) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { width } = useWindowSize();
    const { t } = useLanguage();

    useEffect(() => {
        if (textareaRef.current) {
            adjustHeight();
        }
    }, []);

    const adjustHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
        }
    };

    const resetHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = '98px';
        }
    };

    const submitForm = useCallback(() => {
        if (!textareaRef.current) return;
        const inputValue = textareaRef.current.value;
        if (inputValue.trim() === '') {
            toast.error(t('pleaseEnterMessage'));
            return;
        }
        handleSubmit(inputValue);
        textareaRef.current.value = '';
        resetHeight();
        if (width && width > 768) textareaRef.current?.focus();
    }, [handleSubmit, width, t]);

    return (
        <div className={cx('relative w-full flex flex-col gap-4', className)}>
            {/* شريط إدخال واحد: ميكروفون + plus + حقل النص + زر إرسال (بنفس شكل التصميم) */}
            <div className="flex items-end gap-2 rounded-2xl border border-border/60 bg-muted/80 dark:bg-muted/50 p-2 focus-within:ring-2 focus-within:ring-ring/30 focus-within:border-accent/40 transition-shadow min-h-[56px]">
                <button
                    type="button"
                    className="shrink-0 p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={t('ariaLabelMic')}
                >
                    <MicIcon className="w-5 h-5" />
                </button>
                <button
                    type="button"
                    className="shrink-0 p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={t('ariaLabelAdd')}
                >
                    <PlusIcon size={20} />
                </button>
                <Textarea
                    ref={textareaRef}
                    placeholder={t('askPlaceholder')}
                    className={cx(
                        'flex-1 min-h-[40px] max-h-[calc(75dvh)] overflow-hidden resize-none border-0 bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground !text-base py-2.5',
                        className,
                    )}
                    rows={1}
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (isLoading) toast.error(t('pleaseWait'));
                            else submitForm();
                        }
                    }} />
            </div>
        </div>
    );
};
