import { useEffect, useId, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  hideClose?: boolean;
}

export default function Modal({ isOpen, onClose, title, children, hideClose }: ModalProps) {
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) { document.body.style.overflow = ''; return; }
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    requestAnimationFrame(() => sheetRef.current?.querySelector<HTMLElement>('button, input, textarea, select, [tabindex]:not([tabindex="-1"])')?.focus());
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', onKeyDown); previous?.focus(); };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0D192B]/45 backdrop-blur-[1px]"
            onClick={onClose}
          />
          {/* 바텀 시트 — left-0 right-0 mx-auto 방식으로 iOS transform 충돌 방지 */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-w-[480px] flex-col rounded-t-[20px] border border-[#E7E1D9] bg-[#FFFDFC] shadow-2xl"
            style={{ maxHeight: '90dvh' }}
          >
            {(title || !hideClose) && (
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
                {title && <h3 id={titleId} className="font-bold text-gray-800 text-base">{title}</h3>}
                {!hideClose && (
                  <button
                    onClick={onClose}
                    aria-label="닫기"
                    className="ml-auto flex h-11 w-11 items-center justify-center rounded-[10px] hover:bg-[#F1EDE7] transition-colors"
                  >
                    <X size={18} className="text-gray-500" />
                  </button>
                )}
              </div>
            )}
            <div className="overflow-y-auto flex-1 p-5 pb-safe">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
