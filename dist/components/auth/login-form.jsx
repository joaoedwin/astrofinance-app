"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginForm = LoginForm;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const use_toast_1 = require("@/hooks/use-toast");
const auth_context_1 = require("@/contexts/auth-context");
const alert_1 = require("@/components/ui/alert");
const image_1 = __importDefault(require("next/image"));
function LoginForm() {
    const [email, setEmail] = (0, react_1.useState)("");
    const [password, setPassword] = (0, react_1.useState)("");
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)("");
    const router = (0, navigation_1.useRouter)();
    const { login } = (0, auth_context_1.useAuthContext)();
    const [saving, setSaving] = (0, react_1.useState)(false);
    const slides = [
        {
            image: "/onboarding1.svg",
            headline: "Visualize seu futuro financeiro",
            subheadline: "Acompanhe saldos, metas e evolução dos seus gastos em um dashboard completo, com modo claro e escuro."
        },
        {
            image: "/onboarding2.svg",
            headline: "Gerencie parcelamentos e faturas sem dor de cabeça",
            subheadline: "Visualize todas as suas parcelas, organize faturas mensais e nunca mais perca o controle das suas dívidas."
        },
        {
            image: "/onboarding3.svg",
            headline: "Relatórios e transações na palma da mão",
            subheadline: "Tenha relatórios automáticos, filtre e categorize suas transações para entender onde seu dinheiro está indo."
        }
    ];
    const [slide, setSlide] = (0, react_1.useState)(0);
    const [fade, setFade] = (0, react_1.useState)(true);
    const [progress, setProgress] = (0, react_1.useState)(0);
    const [paused, setPaused] = (0, react_1.useState)(false);
    const [lastTimestamp, setLastTimestamp] = (0, react_1.useState)(Date.now());
    const timerRef = (0, react_1.useRef)(null);
    const SLIDE_DURATION = 8000; // 8 segundos
    // Timer e progresso
    (0, react_1.useEffect)(() => {
        let start = Date.now();
        let localProgress = progress;
        if (paused) {
            setLastTimestamp(Date.now());
            if (timerRef.current)
                clearInterval(timerRef.current);
            return;
        }
        timerRef.current = setInterval(() => {
            const now = Date.now();
            const elapsed = now - (paused ? lastTimestamp : start);
            let newProgress = localProgress + (elapsed / SLIDE_DURATION) * 100;
            if (newProgress >= 100) {
                setProgress(100);
                setTimeout(() => {
                    nextSlide();
                }, 200);
            }
            else {
                setProgress(newProgress);
            }
        }, 50);
        return () => {
            if (timerRef.current)
                clearInterval(timerRef.current);
        };
        // eslint-disable-next-line
    }, [slide, paused]);
    const nextSlide = () => {
        setFade(false);
        setTimeout(() => {
            setSlide((slide + 1) % slides.length);
            setFade(true);
            setProgress(0);
        }, 200);
    };
    const prevSlide = () => {
        setFade(false);
        setTimeout(() => {
            setSlide((slide - 1 + slides.length) % slides.length);
            setFade(true);
            setProgress(0);
        }, 200);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            await login(email, password);
        }
        catch (error) {
            setError("Usuário ou senha incorretos");
            (0, use_toast_1.toast)({
                title: "Usuário ou senha incorretos",
                description: error instanceof Error ? error.message : "Verifique suas credenciais e tente novamente.",
                variant: "destructive",
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    return (<div className="flex min-h-[80vh] w-full max-w-5xl rounded-xl overflow-hidden shadow-lg bg-white">
      {/* Lado esquerdo ilustrativo com carrossel */}
      <div className="hidden md:flex flex-col justify-end items-center relative w-[60%] p-0 overflow-hidden border" style={{ borderColor: '#e5e7eb', borderWidth: 1, background: '#F3F3FF' }}>
        {/* Imagem cobre todo o lado esquerdo, padding só nas laterais */}
        <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} className="absolute inset-0 w-full h-full z-0 flex items-center justify-center px-8 md:px-8 sm:px-4" style={{ cursor: 'pointer' }}>
          <image_1.default src={slides[slide].image} alt="Onboarding" fill style={{ objectFit: 'contain', zIndex: 0, opacity: 1 }} onError={(e) => { e.currentTarget.style.display = 'none'; }} sizes="(min-width: 1024px) 60vw, 100vw"/>
          {/* Gradiente na parte inferior para contraste, bem mais suave */}
          <div className="absolute bottom-0 left-0 w-full h-40" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(229,231,235,0.10) 60%, rgba(229,231,235,0.18) 100%)', zIndex: 2 }}/>
        </div>
        {/* Elementos sobrepostos */}
        <div className="relative w-full flex flex-col items-center z-10 px-6">
          <div className="flex gap-2 w-full max-w-xs mx-auto mb-2 z-10">
            {slides.map((_, idx) => (<div key={idx} className="flex-1 h-1 bg-white/30 rounded overflow-hidden">
                <div className={`h-full transition-all duration-400 ${idx === slide ? 'bg-[#232946]' : 'bg-white/50'}`} style={{ width: idx === slide ? `${progress}%` : idx < slide ? '100%' : '0%' }}/>
              </div>))}
          </div>
          <div className="flex gap-2 justify-center w-full mt-2 z-10">
            <button onClick={prevSlide} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[#232946] border border-white/20 hover:bg-white/20 transition">←</button>
            <button onClick={nextSlide} className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#232946] border border-white/20 hover:bg-white/80 transition">→</button>
          </div>
        </div>
      </div>
      {/* Lado direito: formulário */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 p-8 bg-white">
        <div className="w-full max-w-[350px]">
          <div className="flex flex-col items-center mb-6">
            <image_1.default src="/placeholder-logo.svg" alt="Astro Finance Logo" width={120} height={120} className="mb-2"/>
            <h1 className="text-2xl font-bold mb-2 text-[#232946]">Entrar no Astro Finance</h1>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4 mb-2">
              <div className="flex flex-col gap-1.5">
                <label_1.Label htmlFor="email">E-mail</label_1.Label>
                <input_1.Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required/>
              </div>
              <div className="flex flex-col gap-1.5">
                <label_1.Label htmlFor="password">Senha</label_1.Label>
                <input_1.Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required/>
                <span className="text-xs text-gray-400 mt-1">Mínimo de 8 caracteres</span>
              </div>
              {error && (<alert_1.Alert variant="destructive">
                  <alert_1.AlertDescription>{error}</alert_1.AlertDescription>
                </alert_1.Alert>)}
            </div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="remember" className="accent-[#232946]"/>
                <label htmlFor="remember" className="text-sm">Lembrar de mim</label>
              </div>
              <button type="button" className="text-xs text-[#232946] hover:underline" onClick={() => alert('Funcionalidade de recuperação de senha em breve!')}>Esqueceu a senha?</button>
            </div>
            <button_1.Button type="submit" className="w-full bg-[#232946] hover:bg-[#1a1a2e] text-white" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </button_1.Button>
          </form>
        </div>
      </div>
    </div>);
}
