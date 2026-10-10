import { lazy, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAppDispatch } from '@/redux/hook';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Landing from '@/pages/Landing';
import { Toaster } from './components/ui/sonner';
import { dispatchAuth } from './redux/hooks/dispatchAuth';
import { useAuth } from './redux/hooks/useAuth';
import { prefetchPages } from './utils/page';
import { useSearchParams } from 'react-router-dom';
import { notifyExtensionLoggedIn } from './utils/extension';

const Profile = lazy(() => import('@/pages/Profile'));
const Settings = lazy(() => import('@/pages/Settings'));
const Sheet = lazy(() => import('@/pages/Sheet'));
const Jobs = lazy(() => import('@/pages/Jobs'));
const Privacy = lazy(() =>
  import('@/pages/Legal').then((m) => ({ default: m.Privacy }))
);
const Terms = lazy(() =>
  import('@/pages/Legal').then((m) => ({ default: m.Terms }))
);

const App = () => {
  const dispatch = useAppDispatch();
  const { fetchCurrentUser } = dispatchAuth();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  useEffect(() => {
    if (user && searchParams.get('from') === 'extension')
      notifyExtensionLoggedIn();
  }, [user?.id]);
  useEffect(() => {
    fetchCurrentUser();
  }, [dispatch]);

  useEffect(() => {
    if (user) prefetchPages();
  }, [user?.id]);

  return (
    <>
      <Toaster
        closeButton
        toastOptions={{
          classNames: {
            closeButton: '!right-0 !left-auto !translate-x-0',
          },
        }}
      />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Landing />} />
          <Route element={<ProtectedRoute />}>
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="sheet" element={<Sheet />} />
            <Route path="jobs" element={<Jobs />} />
          </Route>
          <Route path="privacy" element={<Privacy />} />
          <Route path="terms" element={<Terms />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
