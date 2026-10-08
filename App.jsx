import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { AuthPage, BackendUnavailable, UserManagement } from "./features/auth/AuthScreens";
import Navbar from "./features/navigation/Navbar";
import Dashboard from "./features/queue/Dashboard";
import { GetQueue, Home, QueueDisplay } from "./features/queue/PublicPages";
import { apiRequest } from "./shared/api";

const EMPTY_STATE = {
  queues: [],
  currentQueue: null,
  counters: { 1: null, 2: null, 3: null },
};

function App() {
  const navigate = useNavigate();
  const [authStatus, setAuthStatus] = useState({
    loading: true,
    configured: false,
    user: null,
    error: "",
  });
  const [data, setData] = useState(EMPTY_STATE);
  const [connectionError, setConnectionError] = useState("");
  const [clock, setClock] = useState({ time: "", date: "", day: "", year: "" });

  const refreshData = useCallback(async () => {
    try {
      const endpoint = authStatus.user ? "/state" : "/display";
      setData(await apiRequest(endpoint));
      setConnectionError("");
    } catch (error) {
      setConnectionError(error.message);
    }
  }, [authStatus.user]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      apiRequest("/auth/status")
        .then((status) => {
          if (active) setAuthStatus({ ...status, loading: false, error: "" });
        })
        .catch((error) => {
          if (active) {
            setAuthStatus({ loading: false, configured: true, user: null, error: error.message });
          }
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (authStatus.loading || !authStatus.configured) return undefined;
    const initialRefresh = window.setTimeout(refreshData, 0);
    const interval = window.setInterval(refreshData, 2000);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
    };
  }, [authStatus.configured, authStatus.loading, refreshData]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = new Date();
      setClock({
        time: now.toLocaleTimeString(),
        date: now.toLocaleDateString(),
        day: now.toISOString().slice(0, 10),
        year: now.getFullYear(),
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const mutate = async (path, body = {}) => {
    try {
      const result = await apiRequest(path, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (result.state) setData(result.state);
      setConnectionError("");
      return result;
    } catch (error) {
      setConnectionError(error.message);
      alert(error.message);
      return null;
    }
  };

  const addQueue = async (service, customerName = "") => {
    const endpoint = authStatus.user ? "/queues" : "/public/queues";
    const result = await mutate(endpoint, {
      serviceCode: service.code,
      customerName,
    });
    return result?.queue ?? null;
  };

  const callQueue = (id, counter) => mutate(`/queues/${id}/call`, { counter });
  const cancelQueue = (id) => mutate(`/queues/${id}/cancel`);
  const completeQueue = (id) => mutate(id ? `/queues/${id}/complete` : "/complete");
  const skipQueue = (id) => mutate(id ? `/queues/${id}/skip` : "/skip");

  const resetSystem = () => {
    if (window.confirm("Reset all queue records?")) mutate("/reset");
  };

  const submitAuth = async (endpoint, credentials) => {
    try {
      const result = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      setAuthStatus({ loading: false, configured: true, user: result.user, error: "" });
      navigate("/dashboard");
      return "";
    } catch (error) {
      return error.message;
    }
  };

  const logout = async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch (error) {
      setConnectionError(error.message);
    } finally {
      setAuthStatus((current) => ({ ...current, user: null }));
      navigate("/login");
    }
  };

  if (authStatus.loading) return <div className="auth-loading">Loading QueueFlow...</div>;
  if (authStatus.error) return <BackendUnavailable message={authStatus.error} />;
  if (!authStatus.configured) {
    return <AuthPage setup onSubmit={(credentials) => submitAuth("/auth/setup", credentials)} />;
  }

  return (
    <div className="app-shell">
      <Navbar clock={clock} user={authStatus.user} onLogout={logout} />
      {connectionError && <div className="alert alert-danger m-3" role="alert">Backend connection: {connectionError}</div>}
      <div className="app-content">
        <Routes>
          <Route path="/" element={<Home data={data} />} />
          <Route path="/get-queue" element={<GetQueue addQueue={addQueue} />} />
          <Route path="/display" element={<QueueDisplay data={data} />} />
          <Route
            path="/dashboard"
            element={authStatus.user ? (
              <Dashboard
                data={data}
                today={clock.day}
                user={authStatus.user}
                addQueue={addQueue}
                callQueue={callQueue}
                cancelQueue={cancelQueue}
                completeQueue={completeQueue}
                skipQueue={skipQueue}
                resetSystem={resetSystem}
                refreshData={refreshData}
              />
            ) : <Navigate to="/login" replace />}
          />
          <Route
            path="/users"
            element={authStatus.user?.role === "superadmin" ? <UserManagement /> : <Navigate to={authStatus.user ? "/dashboard" : "/login"} replace />}
          />
          <Route
            path="/login"
            element={authStatus.user ? <Navigate to="/dashboard" replace /> : <AuthPage onSubmit={(credentials) => submitAuth("/auth/login", credentials)} />}
          />
        </Routes>
      </div>
      <footer className="app-footer">© {clock.year && `${clock.year} `}QueueFlow. All rights reserved.</footer>
    </div>
  );
}

export default App;
