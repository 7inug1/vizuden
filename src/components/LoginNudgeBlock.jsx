import { useNavigate } from 'react-router-dom';

export default function LoginNudgeBlock({ heading, sub, nextPath }) {
  const navigate = useNavigate();
  return (
    <div className="border-t border-stone-100 pt-6 mb-6">
      <p className="text-sm font-light text-stone-700 mb-1">{heading}</p>
      {sub && (
        <p className="text-xs text-stone-400 leading-relaxed mt-1 mb-5">{sub}</p>
      )}
      <button
        onClick={() => navigate('/auth/email', { state: { nextPath } })}
        className="w-full py-4 bg-stone-900 text-stone-50 text-sm tracking-widest uppercase
          hover:bg-stone-800 active:bg-stone-700 transition-colors duration-200"
      >
        로그인 / 회원가입
      </button>
    </div>
  );
}
