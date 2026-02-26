import { StyleSheet } from 'react-native';

import { colors } from '../theme/colors';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: colors.text,
  },
  emptyState: {
    marginTop: 14,
    fontSize: 14,
    color: colors.text,
  },
});

export default styles;
