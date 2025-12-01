"use client";
import { useEffect } from 'react';
import { GoogleAuthProvider } from 'firebase/auth';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';
import { auth } from '../../lib/firebase';

const LoginPage = () => {
  useEffect(() => {
    const ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(auth);
    ui.start('#firebaseui-auth-container', {
      signInOptions: [
        GoogleAuthProvider.PROVIDER_ID
      ],
      signInSuccessUrl: '/dashboard',
      credentialHelper: firebaseui.auth.CredentialHelper.NONE
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
