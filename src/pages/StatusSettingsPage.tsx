import { useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { defaultStatusThresholds, statusConfig } from '../utils/studentStats';
import type { StatusThresholds } from '../types';

const FIELDS: {
  key: keyof StatusThresholds;
  label: string;
  description: string;
  unit: string;
  min: number;
  max: number;
}[] = [
  {
    key: 'unsubmittedOverdue',
    label: '"미제출" 기준',
    description: '기한이 지난 미션이 이 개수 이상이면 "미제출" 상태로 표시해요.',
    unit: '개 이상',
    min: 1,
    max: 10,
  },
  {
    key: 'counselingOverdue',
    label: '"상담필요" 기준 (미제출 개수)',
    description: '기한이 지난 미션이 이 개수 이상이면 "상담필요" 상태로 표시해요.',
    unit: '개 이상',
    min: 1,
    max: 20,
  },
  {
    key: 'counselingRate',
    label: '"상담필요" 기준 (완료율)',
    description: '완료된 미션의 성공률이 이 값 미만이면 "상담필요" 상태로 표시해요.',
    unit: '% 미만',
    min: 0,
    max: 100,
  },
  {
    key: 'excellentRate',
    label: '"우수" 기준 (완료율)',
    description: '완료된 미션의 성공률이 이 값 이상이면 "우수" 상태로 표시해요.',
    unit: '% 이상',
    min: 0,
    max: 100,
  },
];

export default function StatusSettingsPage() {
  const { currentUser, updateStatusThresholds } = useAuthStore();
  const [values, setValues] = useState<StatusThresholds>(
    currentUser?.statusThresholds ?? defaultStatusThresholds
  );
  const [savedFeedback, setSavedFeedback] = useState(false);

  if (!currentUser) return null;

  const handleChange = (key: keyof StatusThresholds, raw: string) => {
    const num = Number(raw);
    if (Number.isNaN(num)) return;
    setValues((v) => ({ ...v, [key]: num }));
  };

  const handleSave = () => {
    updateStatusThresholds(currentUser.id, values);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleReset = () => setValues(defaultStatusThresholds);

  return (
    <div className="page-container">
      <Header title="⚙️ 학생 상태 기준 설정" showBack showPoints={false} />

      <div className="content-area px-4 py-5 space-y-4">
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
          <p className="text-sm text-purple-700 font-bold mb-1">학생 상태는 이렇게 정해져요</p>
          <p className="text-xs text-purple-500 leading-relaxed">
            기한이 지났는데 제출하지 않은 미션 개수와, 완료된 미션의 성공률을 기준으로
            <span className={`mx-1 px-1.5 py-0.5 rounded-md font-bold ${statusConfig.EXCELLENT.bg} ${statusConfig.EXCELLENT.color}`}>우수</span>
            <span className={`mx-1 px-1.5 py-0.5 rounded-md font-bold ${statusConfig.CAUTION.bg} ${statusConfig.CAUTION.color}`}>주의</span>
            <span className={`mx-1 px-1.5 py-0.5 rounded-md font-bold ${statusConfig.UNSUBMITTED.bg} ${statusConfig.UNSUBMITTED.color}`}>미제출</span>
            <span className={`mx-1 px-1.5 py-0.5 rounded-md font-bold ${statusConfig.COUNSELING.bg} ${statusConfig.COUNSELING.color}`}>상담필요</span>
            로 분류해요. 아래에서 그 기준을 직접 조정할 수 있어요.
          </p>
        </div>

        {FIELDS.map((field, i) => (
          <motion.div
            key={field.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl shadow-sm p-4"
          >
            <p className="text-sm font-bold text-gray-800">{field.label}</p>
            <p className="text-xs text-gray-400 mt-0.5 mb-3 leading-relaxed">{field.description}</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={field.min}
                max={field.max}
                value={values[field.key]}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="input-field text-sm font-bold w-24 text-center"
              />
              <span className="text-sm text-gray-500 font-medium">{field.unit}</span>
            </div>
          </motion.div>
        ))}

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-3 rounded-2xl text-sm font-bold text-gray-500 bg-gray-100 active:scale-95 transition-all"
          >
            <RotateCcw size={14} />
            기본값으로
          </button>
          <Button fullWidth size="lg" onClick={handleSave} className="rounded-2xl">
            {savedFeedback ? '✅ 저장됐어요!' : '저장하기'}
          </Button>
        </div>
      </div>
    </div>
  );
}
