// Fails a release build that would ship fake data or fake sign-in (#53).
// Release = Vercel production deploy (VERCEL_ENV=production) or an EAS `production` build.
// Runs before `expo export` (build:web) and as the EAS pre-install hook; other builds pass through.
const env = process.env;
const release =
  env.VERCEL_ENV === 'production' ||
  env.EAS_BUILD_PROFILE === 'production' ||
  env.YMARQ_RELEASE === '1';

if (release) {
  const problems = [];
  if (env.EXPO_PUBLIC_DATA_SOURCE !== 'api') problems.push('EXPO_PUBLIC_DATA_SOURCE must be "api"');
  if (!env.EXPO_PUBLIC_API_URL?.startsWith('https://')) {
    problems.push('EXPO_PUBLIC_API_URL must be the https:// address of the Ymarq API');
  }
  if (env.EXPO_PUBLIC_AUTH !== 'firebase') problems.push('EXPO_PUBLIC_AUTH must be "firebase"');
  // The website needs the Firebase web config; the iOS/Android apps bundle their own Firebase files.
  const webBuild = !env.EAS_BUILD_PROFILE;
  for (const name of webBuild ? ['API_KEY', 'AUTH_DOMAIN', 'PROJECT_ID', 'APP_ID'] : []) {
    if (!env[`EXPO_PUBLIC_FIREBASE_${name}`])
      problems.push(`EXPO_PUBLIC_FIREBASE_${name} is missing`);
  }
  if (problems.length > 0) {
    console.error(
      `Release build refused: it would not use the real server and sign-in.\n- ${problems.join('\n- ')}\n` +
        'Set these in Vercel (project ymarq-app → Settings → Environment Variables → Production) ' +
        'or in EAS for the production profile.',
    );
    process.exit(1);
  }
  console.log('Release build: real API and Firebase sign-in.');
}
