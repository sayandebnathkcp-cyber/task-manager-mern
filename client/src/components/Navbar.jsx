import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link to="/" className="navbar-logo">
                    <div className="navbar-logo-icon">✦</div>
                    <span>TaskFlow</span>
                </Link>

                <div className="navbar-links">
                    {isAuthenticated ? (
                        <div className="navbar-user">
                            <span className="navbar-greeting">
                                Hello, <strong>{user?.name}</strong>
                            </span>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={handleLogout}
                                id="logout-button"
                            >
                                ↗ Logout
                            </button>
                        </div>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-ghost btn-sm" id="nav-login">
                                Sign In
                            </Link>
                            <Link to="/register" className="btn btn-primary btn-sm" id="nav-register">
                                Get Started
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
