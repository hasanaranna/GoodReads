import { useState } from "react";
import { useNavigate } from "react-router";
import { jwtDecode } from "jwt-decode";
import { API_BASE_URL } from "../../config";
import { useBooks } from "../context/BooksContext";
import { BookOpen, Eye, EyeOff } from "lucide-react";

interface JwtPayload { id: string; name?: string; username?: string; }

export function Login() {
  const navigate = useNavigate();
  const { setUserName } = useBooks();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (isLogin) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        const data = await response.json();
        if (!response.ok) { setErrorMessage(data.error?.message || "Login failed."); return; }
        if (data.access_token) {
          localStorage.setItem("access_token", data.access_token);
          try {
            const decoded = jwtDecode<JwtPayload>(data.access_token);
            setUserName(data.user?.name || decoded.name || data.user?.username || decoded.username || "User");
          } catch { setUserName("User"); }
        }
        navigate("/mybooks");
      } catch { setErrorMessage("Network error. Could not connect."); }
      return;
    }

    if (password !== confirmPassword) { setErrorMessage("Passwords do not match."); return; }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, email, password, date_of_birth: dob }),
      });
      const data = await response.json();
      if (!response.ok) {
        let msg = data.error?.message || "Registration failed.";
        if (data.error?.details?.length > 0) msg += " " + data.error.details.map((d: any) => d.message).join(" ");
        setErrorMessage(msg); return;
      }
      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
        try {
          const decoded = jwtDecode<JwtPayload>(data.access_token);
          setUserName(data.user?.name || decoded.name || name || "User");
        } catch { setUserName(name || "User"); }
      }
      navigate("/mybooks");
    } catch { setErrorMessage("Network error. Could not connect."); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--theme-bg-main)', padding: '24px', transition: 'background-color 0.3s' }}>
      <div style={{ width: 440, maxWidth: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--theme-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.15)', transition: 'background-color 0.3s' }}>
              <BookOpen size={22} color="white" />
            </div>
            <span style={{ fontSize: 26, fontWeight: 700, color: 'var(--theme-text-main)', letterSpacing: '-0.5px' }}>GoodReads</span>
          </div>
          <p style={{ fontSize: 15, color: 'var(--theme-text-muted)', margin: 0 }}>
            {isLogin ? "Welcome back! Sign in to continue." : "Join our community of readers."}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ background: 'var(--theme-bg-card)', borderRadius: 16, padding: 28, boxShadow: 'var(--theme-shadow)', border: '1px solid var(--theme-border)', transition: 'background-color 0.3s, border-color 0.3s, box-shadow 0.3s' }}>
            {errorMessage && (
              <div style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#ef4444', fontSize: 13, padding: '10px 14px', borderRadius: 10, marginBottom: 16, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                {errorMessage}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {!isLogin && (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--theme-text-muted)', marginBottom: 6 }}>Full Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Smith"
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--theme-border)', borderRadius: 10, fontSize: 14, color: 'var(--theme-text-main)', outline: 'none', boxSizing: 'border-box', background: 'var(--theme-bg-input)', transition: 'border-color 0.2s, background-color 0.3s, color 0.3s' }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--theme-accent)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--theme-border)'}
                    required />
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--theme-text-muted)', marginBottom: 6 }}>Username</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                  placeholder="janesmith"
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--theme-border)', borderRadius: 10, fontSize: 14, color: 'var(--theme-text-main)', outline: 'none', boxSizing: 'border-box', background: 'var(--theme-bg-input)', transition: 'border-color 0.2s, background-color 0.3s, color 0.3s' }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--theme-accent)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--theme-border)'}
                  required />
              </div>
              {!isLogin && (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--theme-text-muted)', marginBottom: 6 }}>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--theme-border)', borderRadius: 10, fontSize: 14, color: 'var(--theme-text-main)', outline: 'none', boxSizing: 'border-box', background: 'var(--theme-bg-input)', transition: 'border-color 0.2s, background-color 0.3s, color 0.3s' }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--theme-accent)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--theme-border)'}
                    required />
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--theme-text-muted)', marginBottom: 6 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ width: '100%', padding: '10px 14px', paddingRight: 42, border: '1.5px solid var(--theme-border)', borderRadius: 10, fontSize: 14, color: 'var(--theme-text-main)', outline: 'none', boxSizing: 'border-box', background: 'var(--theme-bg-input)', transition: 'border-color 0.2s, background-color 0.3s, color 0.3s' }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--theme-accent)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--theme-border)'}
                    required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--theme-text-light)', padding: 0 }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {!isLogin && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--theme-text-muted)', marginBottom: 6 }}>Confirm Password</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--theme-border)', borderRadius: 10, fontSize: 14, color: 'var(--theme-text-main)', outline: 'none', boxSizing: 'border-box', background: 'var(--theme-bg-input)', transition: 'border-color 0.2s, background-color 0.3s, color 0.3s' }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--theme-accent)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--theme-border)'}
                      required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--theme-text-muted)', marginBottom: 6 }}>Date of Birth</label>
                    <input type="date" value={dob} onChange={(e) => setDob(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--theme-border)', borderRadius: 10, fontSize: 14, color: 'var(--theme-text-main)', outline: 'none', boxSizing: 'border-box', background: 'var(--theme-bg-input)', transition: 'border-color 0.2s, background-color 0.3s, color 0.3s' }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--theme-accent)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--theme-border)'}
                      required />
                  </div>
                </>
              )}
            </div>
          </div>

          <button type="submit"
            style={{ width: '100%', marginTop: 20, padding: '13px 0', background: 'var(--theme-accent)', color: '#fff', fontWeight: 600, fontSize: 15, border: 'none', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--theme-accent-hover)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--theme-accent)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 28, fontSize: 14, color: 'var(--theme-text-light)' }}>
          {isLogin ? "New to GoodReads?" : "Already have an account?"}{" "}
          <button onClick={() => { setIsLogin(!isLogin); setErrorMessage(""); }}
            style={{ background: 'none', border: 'none', color: 'var(--theme-accent)', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
            {isLogin ? "Create account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
