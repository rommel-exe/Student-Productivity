import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>({
    uid: "guest-user",
    email: "fujack2010@gmail.com",
    displayName: "Almanac Scholar",
    emailVerified: true
  } as any);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        if (currentUser.emailVerified) {
          // sync user in firestore Blueprint
          const userRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            try {
              await setDoc(userRef, {
                uid: currentUser.uid,
                email: currentUser.email,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
            } catch(err) {
              console.error("Failed to create user doc", err);
            }
          }
        }
      } else {
        // Fallback to offline/guest mode to bypass the login gate transparently
        setUser({
          uid: "guest-user",
          email: "fujack2010@gmail.com",
          displayName: "Almanac Scholar",
          emailVerified: true
        } as any);
      }
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const isElectron = typeof window !== "undefined" && (window as any).electronAPI !== undefined;
      const isTauri = typeof window !== "undefined" && (window as any).__TAURI__ !== undefined;
      if (isTauri || isElectron) {
        // In desktop platforms, popups often fail due to strict WebView/browser scope window policies. 
        // We use signInWithRedirect instead to ensure the OAuth flow redirects properly within the workspace environment.
        // NOTE: Please ensure `http://localhost`, `tauri://localhost`, or `http://tauri.localhost` are added as Authorized Domains in Firebase Console.
        const { signInWithRedirect } = await import("firebase/auth");
        await signInWithRedirect(auth, provider);
      } else {
        await signInWithPopup(auth, provider);
      }
    } catch (error) {
      console.error("Error signing in with Google", error);
      alert(error instanceof Error ? error.message : "Error signing in");
    }
  };

  const logout = async () => {
    localStorage.removeItem("almanac_suite_workspace_data");
    await signOut(auth);
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
