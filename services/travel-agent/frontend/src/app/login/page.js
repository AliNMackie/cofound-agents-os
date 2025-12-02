"use client";
import { useEffect } from 'react';
import { GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../lib/firebase';

const LoginPage = () => {
  useEffect(() => {
    // Dynamically import firebaseui only on the client side
    import('firebaseui').then((firebaseuiModule) => {
      // Also import the CSS dynamically
      import('firebaseui/dist/firebaseui.css');

      const firebaseui = firebaseuiModule;
      const ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(auth);

      ui.start('#firebaseui-auth-container', {
        signInOptions: [
          GoogleAuthProvider.PROVIDER_ID
        ],
        signInSuccessUrl: '/dashboard',
        credentialHelper: firebaseui.auth.CredentialHelper.NONE
      });
    });
  }, []);

  return (
    <div>
      <h1>Login</h1>
      <div id="firebaseui-auth-container"></div>
    </div>
  );
};

export default LoginPage;
