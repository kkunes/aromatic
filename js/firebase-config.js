/**
 * Firebase Configuration - Aromatic POS
 * 
 * SECURITY NOTE:
 * The 'apiKey' in Firebase is NOT a secret like a private key. It is meant to be 
 * used in the browser. However, to keep your system SECURE, you MUST:
 * 1. Restrict this key in the Google Cloud Console (HTTP Referrers).
 * 2. Configure Firebase Security Rules for Firestore to prevent unauthorized access.
 */

const firebaseConfig = {
    apiKey: "AIzaSyAZtdsNHHChRhjSzh0DpH3IJkl1xfQZXqw",
    authDomain: "pos-cafeteria-8a905.firebaseapp.com",
    projectId: "pos-cafeteria-8a905",
    storageBucket: "pos-cafeteria-8a905.firebasestorage.app",
    messagingSenderId: "200789628092",
    appId: "1:200789628092:web:d5922ad084ecd74793acb9"
};

// Global initialization
if (typeof firebase !== 'undefined') {
    // Check if already initialized to avoid errors on hot reload or multiple inclusions
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);

        // Inicio de sesión anónimo automático para asegurar la conexión
        firebase.auth().signInAnonymously()
            .then(() => {
                console.log("🔐 Sesión segura de Firebase activa");
            })
            .catch((error) => {
                console.error("Error en Auth:", error.code, error.message);
            });

        // Enable offline persistence for better user experience
        firebase.firestore().enablePersistence()
            .catch((err) => {
                if (err.code == 'failed-precondition') {
                    console.warn("Múltiples pestañas abiertas, la persistencia solo puede activarse en una a la vez.");
                } else if (err.code == 'unimplemented') {
                    console.warn("El navegador actual no soporta todas las características de persistencia.");
                }
            });

        console.log("🔥 Firebase initialized (Offline Mode Active)");
    }
} else {
    console.warn("Firebase SDK no cargado. El sistema operará en modo local/mock.");
}
