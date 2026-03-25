import { useState } from "react";
import { useNavigate } from "react-router";
import { API_BASE_URL } from "../../config";

export function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (isLogin) {
      // No validation for now, simply redirect to mybooks
      navigate("/mybooks");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          username,
          email,
          password,
          date_of_birth: dob,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        let msg = data.error?.message || "Registration failed. Please try again.";
        if (data.error?.details && data.error.details.length > 0) {
          msg += " " + data.error.details.map((d: any) => d.message).join(" ");
        }
        setErrorMessage(msg);
        return;
      }

      // Successful registration
      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
      }
      navigate("/mybooks");
    } catch (error) {
      setErrorMessage("Network error. Could not connect to the server.");
    }
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
            {errorMessage && (
              <div className="text-red-600 text-center text-[14px]">
                {errorMessage}
              </div>
            )}
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
            {!isLogin && (
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-[14px] font-semibold text-[#382110]">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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

            {!isLogin && (
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-[14px] font-semibold text-[#382110]">
                  Date of birth
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
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
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMessage("");
            }}
            className="bg-transparent border-0 appearance-none shadow-none text-[#00635d] hover:underline no-underline font-semibold cursor-pointer"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
