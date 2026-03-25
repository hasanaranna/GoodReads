import { useState } from "react";
import { useNavigate } from "react-router";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // No validation for now, simply redirect to mybooks
    navigate("/mybooks");
  };

  return (
    <div className="flex justify-center items-center py-16 px-4">
      <div className="w-full max-w-sm bg-[#ffffff] border border-[#d8d0bb] rounded-lg p-8 shadow-sm">
        <h1 
          className="text-[28px] text-[#382110] font-bold mb-6 text-center" 
          style={{ fontFamily: "Georgia, serif" }}
        >
          Sign in to Goodreads
        </h1>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-[13px] font-semibold text-[#382110] mb-1">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[#ccc] rounded px-3 py-2 text-[14px] text-[#382110] outline-none focus:border-[#00635d] bg-[#ffffff]"
              required
            />
          </div>
          
          <div>
            <label className="block text-[13px] font-semibold text-[#382110] mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[#ccc] rounded px-3 py-2 text-[14px] text-[#382110] outline-none focus:border-[#00635d] bg-[#ffffff]"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-[#f4f0e6] text-[#382110] border border-[#d8d0bb] py-2 rounded text-[14px] font-semibold mt-2 hover:bg-[#e8e0d0] transition-colors"
          >
            Sign in
          </button>
        </form>
        
        <div className="mt-6 pt-6 border-t border-[#d8d0bb] text-center text-[13px] text-gray-600">
          Not a member? <a href="#" className="text-[#00635d] hover:underline no-underline">Sign up</a>
        </div>
      </div>
    </div>
  );
}
