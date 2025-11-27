import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes), provideFirebaseApp(() => initializeApp({ projectId: "community-appdev", appId: "1:903859173134:web:03b539ce71d1f532de095f", storageBucket: "community-appdev.firebasestorage.app", apiKey: "AIzaSyBDpWMfxyFMiJG5F1i-YddxaL8SYyFyA1A", authDomain: "community-appdev.firebaseapp.com", messagingSenderId: "903859173134", measurementId: "G-F6S948FX0K"})), provideAuth(() => getAuth()), provideFirestore(() => getFirestore())
  ]
};
