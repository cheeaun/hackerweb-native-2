import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

export default function App() {
  const ctx = require.context('./app');
  const Root = ExpoRoot(ctx);
  return <Root />;
}
