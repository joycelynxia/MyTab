import { useNavigate } from "react-router-dom";
import '../styling/Header.css'
const Header: React.FC = () => {
  const nav = useNavigate();

  return (
    <div className="header-container">
      <div onClick={() => nav("/")} className="app-name">
        PUT IT ON MY TAB
      </div>
      <div className="profile">[username]</div>
    </div>
  );
};

export default Header;
