import { useNavigate } from 'react-router-dom';
import { Check, Shirt } from 'lucide-react';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
import GameScene from '../components/game/GameScene';
import GameObject from '../components/game/GameObject';
import PlayerCharacter from '../components/game/PlayerCharacter';
import { useAuthStore } from '../store/authStore';
import { useCharacterStore } from '../store/characterStore';
import type { EyeShape, HairStyle } from '../types';

const SKIN_COLORS = ['#FFE0BD', '#FFD9B3', '#F5C6A0', '#E8B08C', '#C68863', '#8D5524'];
const HAIR_COLORS = ['#1C1C1C', '#4A3526', '#8B5E3C', '#A85C32', '#D4A24E', '#E0B0FF', '#FF6F61', '#5B7FDB'];

const HAIR_STYLES: { value: HairStyle; label: string }[] = [
  { value: 'short', label: '짧은 머리' },
  { value: 'long', label: '긴 머리' },
  { value: 'ponytail', label: '포니테일' },
  { value: 'curly', label: '곱슬머리' },
  { value: 'bowl', label: '단발머리' },
];

const EYE_SHAPES: { value: EyeShape; label: string }[] = [
  { value: 'round', label: '동그란 눈' },
  { value: 'happy', label: '웃는 눈' },
  { value: 'sleepy', label: '졸린 눈' },
  { value: 'star', label: '반짝이는 눈' },
];

export default function CharacterCustomizePage() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { getProfile, ensureProfile, updateProfile, cosmetics } = useCharacterStore();

  if (!currentUser) return null;

  const profile = getProfile(currentUser.id) ?? ensureProfile(currentUser.id, currentUser.name);

  return (
    <div className="page-container">
      <Header title="🧑 캐릭터 꾸미기" showBack />

      <div className="content-area px-4 py-4 space-y-5 pb-8">
        <GameScene background="bg-gradient-to-b from-violet-100 via-purple-50 to-sky-100" height={220}>
          <GameObject x={50} y={62}>
            <PlayerCharacter profile={profile} cosmetics={cosmetics} size={120} />
          </GameObject>
        </GameScene>

        <div>
          <p className="text-sm font-bold text-gray-700 mb-2">피부색</p>
          <div className="flex flex-wrap gap-3">
            {SKIN_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => updateProfile(currentUser.id, { skinColor: color })}
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm border-2"
                style={{ backgroundColor: color, borderColor: profile.skinColor === color ? '#10b981' : 'transparent' }}
              >
                {profile.skinColor === color && <Check size={16} className="text-emerald-600" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-bold text-gray-700 mb-2">머리 스타일</p>
          <div className="grid grid-cols-3 gap-2.5">
            {HAIR_STYLES.map((style) => (
              <button
                key={style.value}
                onClick={() => updateProfile(currentUser.id, { hairStyle: style.value })}
                className={`py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  profile.hairStyle === style.value ? 'bg-emerald-400 text-white shadow-md' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {style.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-bold text-gray-700 mb-2">머리색</p>
          <div className="flex flex-wrap gap-3">
            {HAIR_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => updateProfile(currentUser.id, { hairColor: color })}
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm border-2"
                style={{ backgroundColor: color, borderColor: profile.hairColor === color ? '#10b981' : 'transparent' }}
              >
                {profile.hairColor === color && <Check size={16} className="text-white" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-bold text-gray-700 mb-2">눈 모양</p>
          <div className="grid grid-cols-2 gap-2.5">
            {EYE_SHAPES.map((eye) => (
              <button
                key={eye.value}
                onClick={() => updateProfile(currentUser.id, { eyeShape: eye.value })}
                className={`py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  profile.eyeShape === eye.value ? 'bg-emerald-400 text-white shadow-md' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {eye.label}
              </button>
            ))}
          </div>
        </div>

        <Button fullWidth size="lg" variant="amber" onClick={() => navigate('/village/inventory')} className="rounded-2xl">
          <Shirt size={18} className="mr-1.5" /> 의상 갈아입으러 가기
        </Button>
      </div>
    </div>
  );
}
