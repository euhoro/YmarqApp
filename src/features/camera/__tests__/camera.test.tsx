import * as ImagePicker from 'expo-image-picker';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { View } from 'react-native';
import { PaperProvider } from 'react-native-paper';

import NewListingScreen from '@/app/new-listing';

import { TakePhotoFab } from '../TakePhotoFab';

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
}));

const requestPermission = ImagePicker.requestCameraPermissionsAsync as jest.Mock;
const launchCamera = ImagePicker.launchCameraAsync as jest.Mock;

function Feed() {
  return (
    <View style={{ flex: 1 }}>
      <TakePhotoFab />
    </View>
  );
}

// Returns renderRouter's handle (a promise that also carries getPathname() etc.); await it before querying.
function renderApp(initialUrl = '/') {
  return renderRouter(
    { index: Feed, 'new-listing': NewListingScreen },
    { initialUrl, wrapper: ({ children }) => <PaperProvider>{children}</PaperProvider> },
  );
}

beforeEach(() => jest.clearAllMocks());

describe('camera', () => {
  it('takes a photo and opens it on the new-listing screen', async () => {
    requestPermission.mockResolvedValue({ granted: true });
    launchCamera.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///photo.jpg' }] });
    const app = renderApp();
    await app;

    await fireEvent.press(screen.getByLabelText('Take photo'));

    await waitFor(() => expect(app.getPathname()).toBe('/new-listing'));
    expect(app.getSearchParams()).toEqual({ photoUri: 'file:///photo.jpg' });
    expect(await screen.findByTestId('new-listing-photo')).toBeTruthy();
    expect(launchCamera).toHaveBeenCalledWith({ mediaTypes: 'images', quality: 0.8 });
  });

  it('stays on the feed when the user cancels', async () => {
    requestPermission.mockResolvedValue({ granted: true });
    launchCamera.mockResolvedValue({ canceled: true, assets: null });
    const app = renderApp();
    await app;

    await fireEvent.press(screen.getByLabelText('Take photo'));

    await waitFor(() => expect(launchCamera).toHaveBeenCalled());
    expect(app.getPathname()).toBe('/');
  });

  it('explains when camera permission is denied, without opening the camera', async () => {
    requestPermission.mockResolvedValue({ granted: false });
    const app = renderApp();
    await app;

    await fireEvent.press(screen.getByLabelText('Take photo'));

    expect(await screen.findByText(/Camera permission is needed/)).toBeTruthy();
    expect(launchCamera).not.toHaveBeenCalled();
    expect(app.getPathname()).toBe('/');
  });

  it('shows "No photo" when opened without a photo', async () => {
    await renderApp('/new-listing');

    expect(await screen.findByText('No photo')).toBeTruthy();
  });
});
