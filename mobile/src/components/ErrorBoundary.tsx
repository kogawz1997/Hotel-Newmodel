import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (__DEV__) {
      console.error('[ErrorBoundary] Uncaught error:', error);
      console.error('[ErrorBoundary] Component stack:', info.componentStack);
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.title}>เกิดข้อผิดพลาด</Text>
          <Text style={styles.subtitle}>
            แอปพบปัญหาที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง
          </Text>
          {__DEV__ && this.state.error && (
            <View style={styles.devBox}>
              <Text style={styles.devText} numberOfLines={6}>
                {this.state.error.message}
              </Text>
            </View>
          )}
          <TouchableOpacity style={styles.btn} onPress={this.reset}>
            <Text style={styles.btnText}>ลองใหม่</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#F9FAFB', alignItems: 'center',
    justifyContent: 'center', padding: 32,
  },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  devBox: {
    backgroundColor: '#FEE2E2', borderRadius: 12, padding: 14,
    width: '100%', marginBottom: 24,
  },
  devText: { fontSize: 12, color: '#DC2626', fontFamily: 'monospace' },
  btn: {
    backgroundColor: '#004B87', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 40,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
