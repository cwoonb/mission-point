import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, X, Send } from 'lucide-react';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { useAuthStore } from '../store/authStore';
import { useMissionStore } from '../store/missionStore';
import { formatPoint } from '../utils/helpers';

export default function MissionSubmitPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { getMission, submitMission, getReviewLogs } = useMissionStore();

  const [message, setMessage] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const mission = getMission(id!);
  const latestRejectLog = mission
    ? getReviewLogs(mission.id).find((l) => l.action === 'REJECTED')
    : null;

  if (!mission || !currentUser) {
    return (
      <div className="page-container flex items-center justify-center">
        <p className="text-gray-500">미션을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const needsImage = mission.submissionType === 'IMAGE' || mission.submissionType === 'BOTH';
  const needsText = mission.submissionType === 'TEXT' || mission.submissionType === 'BOTH';
  const isValid =
    (!needsImage || imagePreview) && (!needsText || message.trim());

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!isValid) return;
    setLoading(true);
    setTimeout(() => {
      submitMission(
        mission.id,
        currentUser.id,
        message.trim() || undefined,
        imagePreview ?? undefined
      );
      navigate(`/missions/${mission.id}`, { replace: true });
    }, 500);
  };

  return (
    <div className="page-container">
      <Header title="📤 미션 제출" showBack showPoints={false} />

      <div className="content-area px-4 py-5 space-y-4">
        {/* 반려 메시지 */}
        {latestRejectLog && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-4"
          >
            <p className="text-red-600 font-bold text-sm mb-1">❌ 이전 반려 사유</p>
            <p className="text-red-500 text-sm">"{latestRejectLog.reason}"</p>
          </motion.div>
        )}

        {/* 미션 요약 */}
        <div className="bg-white rounded-3xl shadow-sm p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-gray-800 text-base">{mission.title}</h3>
            <StatusBadge status={mission.status} />
          </div>
          <p className="text-gray-500 text-sm mb-3">{mission.description}</p>
          <div className="flex items-center gap-2">
            <span className="text-amber-500 text-sm">⭐</span>
            <span className="text-amber-700 font-bold text-sm">
              성공 시 +{formatPoint(mission.rewardPoint)}P
            </span>
          </div>
        </div>

        {/* 이미지 업로드 */}
        {needsImage && (
          <div className="bg-white rounded-3xl shadow-sm p-5">
            <label className="text-xs font-bold text-gray-500 mb-3 block">
              📷 이미지 첨부 {mission.submissionType === 'IMAGE' && <span className="text-red-400">*</span>}
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageChange}
            />
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="미리보기"
                  className="w-full rounded-2xl object-cover max-h-64"
                />
                <button
                  onClick={() => setImagePreview(null)}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-10 flex flex-col items-center gap-2 text-gray-400 hover:border-purple-300 hover:bg-purple-50 transition-all active:scale-98"
              >
                <Camera size={28} className="text-gray-300" />
                <p className="text-sm font-semibold">사진 추가하기</p>
                <p className="text-xs">탭하여 카메라 또는 갤러리에서 선택</p>
              </button>
            )}
          </div>
        )}

        {/* 텍스트 입력 */}
        {needsText && (
          <div className="bg-white rounded-3xl shadow-sm p-5">
            <label className="text-xs font-bold text-gray-500 mb-3 block">
              ✍️ 완료 메시지 {mission.submissionType === 'TEXT' && <span className="text-red-400">*</span>}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="미션을 어떻게 완료했는지 알려주세요!&#10;예: 오늘 수학 문제집 3페이지 완료했습니다 😊"
              rows={5}
              className="input-field resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-400 text-right mt-1">{message.length}/500</p>
          </div>
        )}

        <Button
          fullWidth
          size="lg"
          onClick={handleSubmit}
          disabled={!isValid}
          loading={loading}
          className="rounded-3xl"
        >
          <Send size={18} />
          제출하기
        </Button>
      </div>
    </div>
  );
}
