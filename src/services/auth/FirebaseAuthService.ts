// iOS/Android load FirebaseAuthService.native.ts and web loads FirebaseAuthService.web.ts; this file
// only gives TypeScript one module to check imports against.
export { createFirebaseAuthService } from './FirebaseAuthService.native';
