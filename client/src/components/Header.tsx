import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import '../styling/Header.css'

const Header: React.FC = () => {
  const nav = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="header-container">
      <div onClick={() => nav("/home")} className="app-name">
        PUT IT ON MY TAB
      </div>
      <div className="header-profile">
        {user ? (
          <>
            <span className="header-username">{user.name || user.email}</span>
            <button
              type="button"
              onClick={() => {
                logout();
                nav("/");
              }}
              className="header-logout"
            >
              Log out
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => nav("/login")}
            className="header-login"
          >
            Log in
          </button>
        )}
      </div>
    </div>
  );
};

export default Header;
