import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { FONTS, GOLD, SPACING, RADIUS } from '../constants/theme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.iconWrap}>
            <Feather name="alert-circle" size={44} color={GOLD} />
          </View>
          <Text style={styles.title}>Something went wrong.</Text>
          <Text style={styles.sub}>Please restart the app. If the issue persists, contact support.</Text>
          <TouchableOpacity onPress={this.handleReset} style={styles.btn}>
            <Feather name="refresh-cw" size={16} color="#000" />
            <Text style={styles.btnText}>Try Again</Text>
          </TouchableOpacity>
          {__DEV__ && this.state.error && (
            <Text style={styles.devError}>{this.state.error.message}</Text>
          )}
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: GOLD + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    color: '#FFFFFF',
    fontFamily: FONTS.cinzelBold,
    fontSize: 22,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  sub: {
    color: '#666666',
    fontFamily: FONTS.regular,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  btn: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: GOLD,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  btnText: { color: '#000', fontFamily: FONTS.bold, fontSize: 14, letterSpacing: 1 },
  devError: {
    color: '#E74C3C',
    fontFamily: FONTS.regular,
    fontSize: 11,
    marginTop: SPACING.lg,
    textAlign: 'center',
  },
});
