'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from './ui/button';
import { PlusIcon } from './icons';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { useLanguage } from '../context/language-context';
import type { Locale } from '@/lib/i18n';

const LANG_ICON = '/icons/lang-ar-an.png';
const MOI_LOGO = '/icons/MOI_S4_ regular version_V1 1.png';
const ELLIPSE_8 = '/icons/Ellipse 8.png';

export function ChatHeader() {
  const { locale, setLocale, t } = useLanguage();

  const toggleLocale = () => {
    setLocale((locale === 'ar' ? 'en' : 'ar') as Locale);
  };

  return (
    <header
      className="
        sticky top-0 z-10
        flex items-center gap-4
        px-4 md:px-6
        min-h-[88px] md:min-h-[100px]
        bg-transparent
      "
    >
      {/* Logo - 190×54، opacity 1 */}
      <Link
        href="/"
        className="flex items-center gap-3 shrink-0 transition-opacity duration-300 ease-out hover:opacity-90"
      >
        <div className="relative w-[190px] h-[54px] opacity-100">
          <Image
            src={encodeURI(MOI_LOGO)}
            alt={t('ministryName')}
            fill
            className="object-contain"
            priority
            unoptimized
          />
        </div>

      </Link>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <TooltipProvider>
          {/* New Chat */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => globalThis.window.location.reload()}
                className="flex items-center gap-1.5 px-2 h-8 text-muted-foreground hover:text-foreground"
              >
                <PlusIcon size={16} />
                <span className="hidden md:inline text-sm">
                  {t('newChat')}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('newChatTooltip')}</TooltipContent>
          </Tooltip>

          {/* Language - أيقونة فقط، حجم أكبر */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={toggleLocale}
                aria-label={locale === 'ar' ? t('switchToEnglish') : t('switchToArabic')}
                className="
                  flex items-center justify-center
                  p-2
                  rounded-md
                  text-muted-foreground
                  hover:text-foreground
                  hover:bg-muted/80
                  transition-colors
                "
              >
                <Image
                  src={LANG_ICON}
                  alt=""
                  width={100}
                  height={100}
                  className="object-contain"
                  unoptimized
                />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {locale === 'ar' ? t('switchToEnglish') : t('switchToArabic')}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
}
