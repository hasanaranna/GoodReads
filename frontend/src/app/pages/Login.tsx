import { useState } from "react";
import { useNavigate } from "react-router";

export function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // No validation for now, simply redirect to mybooks
    navigate("/mybooks");
  };

  return (
    <div className="flex justify-center py-20 px-4 min-h-[80vh] bg-[#ffffff]">
      <div style={{ width: "400px" }}>
        <div className="text-center mb-10">
          <h1 
            className="text-[32px] text-[#382110] font-bold mb-2 cursor-default" 
            style={{ fontFamily: "Lora, serif" }}
          >
            goodreads
          </h1>
          <p className="text-[15px] text-gray-600" style={{ fontFamily: "Georgia, serif" }}>
            {isLogin ? "Sign in to your account" : "Create an account"}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div 
            className="bg-[#f4f0e6] border border-[#d8d0bb] rounded-md flex flex-col gap-6"
            style={{ padding: "24px", boxSizing: "border-box", gap: "20px" }}
          >
            {!isLogin && (
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-[14px] font-semibold text-[#382110]">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-[#ccc] rounded-sm px-3 py-2 text-[14px] text-[#382110] outline-none shadow-inner focus:border-[#00635d] focus:ring-1 focus:ring-[#00635d] bg-[#ffffff]"
                  style={{ boxSizing: "border-box" }}
                  required
                />
              </div>
            )}
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[14px] font-semibold text-[#382110]">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-[#ccc] rounded-sm px-3 py-2 text-[14px] text-[#382110] outline-none shadow-inner focus:border-[#00635d] focus:ring-1 focus:ring-[#00635d] bg-[#ffffff]"
                style={{ boxSizing: "border-box" }}
                required
              />
            </div>
            
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[14px] font-semibold text-[#382110]">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-[#ccc] rounded-sm px-3 py-2 text-[14px] text-[#382110] outline-none shadow-inner focus:border-[#00635d] focus:ring-1 focus:ring-[#00635d] bg-[#ffffff]"
                style={{ boxSizing: "border-box" }}
                required
              />
            </div>

            {!isLogin && (
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-[14px] font-semibold text-[#382110]">
                  Confirm password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-[#ccc] rounded-sm px-3 py-2 text-[14px] text-[#382110] outline-none shadow-inner focus:border-[#00635d] focus:ring-1 focus:ring-[#00635d] bg-[#ffffff]"
                  style={{ boxSizing: "border-box" }}
                  required
                />
              </div>
            )}
          </div>
          
          <div className="pt-2" style={{ marginBottom: "20px" }}>
            <button
              type="submit"
              className="w-full bg-[#f4f0e6] text-[#382110] border border-[#d8d0bb] rounded-sm text-[14px] font-semibold hover:bg-[#e8e0d0] transition-colors shadow-sm"
              style={{ padding: "12px 16px" }}
            >
              {isLogin ? "Sign In" : "Sign Up"}
            </button>
          </div>
        </form>
        
        <div className="mt-10 pt-5 text-center text-[14px] text-gray-600">
          {isLogin ? "Not a member yet?" : "Already have an account?"}{" "}
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="bg-transparent border-0 appearance-none shadow-none text-[#00635d] hover:underline no-underline font-semibold cursor-pointer"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
