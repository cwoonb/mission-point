import { useEffect } from 'react';
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
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          {/* 바텀 시트 — left-0 right-0 mx-auto 방식으로 iOS transform 충돌 방지 */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-50 shadow-2xl flex flex-col"
            style={{ maxHeight: '90dvh' }}
          >
            {(title || !hideClose) && (
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
                {title && <h3 className="font-bold text-gray-800 text-base">{title}</h3>}
                {!hideClose && (
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-full hover:bg-gray-100 transition-colors ml-auto"
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
