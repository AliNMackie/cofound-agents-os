"use client";
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

const withAuth = (WrappedComponent) => {
  return (props) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.push('/login');
      }
    }, [user, loading, router]);

    if (loading || !user) {
      return <div>Loading...</div>;
    }

    return <WrappedComponent {...props} />;
  };
};

export default withAuth;
