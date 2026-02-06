import { useNavigate } from "react-router-dom";
import "../styling/LandingPage.css";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="landing-card">
        <h1 className="landing-title">Put it on my tab</h1>
        <p className="landing-subtitle">
          Track tabs. Split bills. Stay friends.
        </p>

        <div className="landing-actions">
          <button
            type="button"
            className="landing-btn landing-btn-primary"
            onClick={() => navigate("/signup")}
          >
            Sign up
          </button>
          <button
            type="button"
            className="landing-btn landing-btn-secondary"
            onClick={() => navigate("/home")}
          >
            Continue as guest
          </button>
          <div className="landing-login-hint">
            Already have an account?{" "}
            <button
              type="button"
              className="landing-link"
              onClick={() => navigate("/login")}
            >
              Log in
            </button>
          </div>

          {/* <form onSubmit={handleJoin} className="landing-join-form">
            <input
              type="text"
              placeholder="Paste invite link or share code"
              value={joinInput}
              onChange={(e) => setJoinInput(e.target.value)}
              className="landing-join-input"
            />
            <button type="submit" className="landing-btn landing-btn-secondary">
              Join group
            </button>
          </form> */}

          {/* <div className="landing-login-link">
            <button
              type="button"
              className="landing-link"
              onClick={() => navigate("/login")}
            >
              Log in
            </button>
            <span className="landing-login-hint">
              to access your groups from any device
            </span>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
