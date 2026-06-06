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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-t-3xl z-50 shadow-2xl max-h-[90vh] flex flex-col"
          >
            {(title || !hideClose) && (
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                {title && <h3 className="font-bold text-gray-800 text-lg">{title}</h3>}
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
            <div className="overflow-y-auto flex-1 p-5">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
