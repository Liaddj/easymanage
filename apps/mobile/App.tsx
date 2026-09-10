import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { APP_NAME, DEFAULT_TIMEZONE } from '@flow/shared';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{APP_NAME}</Text>
      <Text style={styles.subtitle}>Booking for solo fitness and tennis coaches</Text>
      <Text style={styles.meta}>Israel · {DEFAULT_TIMEZONE}</Text>
      <Text style={styles.meta}>Roles: provider · client</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  meta: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
  },
});
