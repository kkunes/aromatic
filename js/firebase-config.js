// Firebase Configuration - Replace with your own project credentials
const firebaseConfig = {
    apiKey: "AIzaSyAZtdsNHHChRhjSzh0DpH3IJkl1xfQZXqw",
    authDomain: "pos-cafeteria-8a905.firebaseapp.com",
    projectId: "pos-cafeteria-8a905",
    storageBucket: "pos-cafeteria-8a905.firebasestorage.app",
    messagingSenderId: "200789628092",
    appId: "1:200789628092:web:d5922ad084ecd74793acb9"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);

    // Enable offline persistence
    firebase.firestore().enablePersistence()
        .catch((err) => {
            if (err.code == 'failed-precondition') {
                console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
            } else if (err.code == 'unimplemented') {
                console.warn("The current browser doesn't support all of the features necessary to enable persistence");
            }
        });

    console.log("Firebase initialized with offline persistence");
} else {
    console.warn("Firebase scripts not loaded or offline mode");
}
