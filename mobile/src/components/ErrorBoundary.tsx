import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { logger } from '../lib/logger';

interface Props {
  children: React.ReactNode;
}
interface State {
  error: Error | null;
}

/**
 * Catches render-time exceptions anywhere below it in the tree. Without
 * this, a single bad render (a null field from an API response the code
 * didn't guard for, say) shows React Native's raw red screen with no way
 * back in — this logs the same detail to the in-app log ring buffer
 * (survives the crash, since it's in module state, not component state)
 * and gives the person a way to keep using the app.
 *
 * Deliberately a class component — componentDidCatch has no hook
 * equivalent.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error('app', `Unhandled render error: ${error.message}`, {
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  private reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <View style={styles.wrap}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>
            The app hit an unexpected error. It's been recorded — open Log Viewer from
            the More screen (or the Login screen) if you'd like to see the details.
          </Text>
          <Text style={styles.error}>{this.state.error.message}</Text>
          <Text style={styles.retry} onPress={this.reset}>
            Try again
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12, backgroundColor: '#FBF7EF' },
  title: { fontSize: 20, fontWeight: '600', color: '#1C2B39', textAlign: 'center' },
  body: { fontSize: 14, color: '#7C8894', textAlign: 'center', lineHeight: 20 },
  error: { fontSize: 12, color: '#A24936', textAlign: 'center', fontFamily: 'monospace' },
  retry: { marginTop: 8, fontSize: 15, fontWeight: '600', color: '#B8863B' },
});
