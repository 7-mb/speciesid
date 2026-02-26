import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import type { IdentifyMode } from '../state/mode';
import { useI18n } from '../state/language';
import { colors } from '../theme/colors';

type ModeOption = {
  key: IdentifyMode;
  labelKey: 'modes.plants' | 'modes.moths' | 'modes.mushrooms';
  iconFilled: keyof typeof MaterialCommunityIcons.glyphMap;
  iconOutline: keyof typeof MaterialCommunityIcons.glyphMap;
};

const OPTIONS: ModeOption[] = [
  { key: 'plants', labelKey: 'modes.plants', iconFilled: 'sprout', iconOutline: 'sprout-outline' },
  { key: 'moths', labelKey: 'modes.moths', iconFilled: 'butterfly', iconOutline: 'butterfly-outline' },
  { key: 'mushrooms', labelKey: 'modes.mushrooms', iconFilled: 'mushroom', iconOutline: 'mushroom-outline' },
];

type Props = {
  mode: IdentifyMode;
  onChange: (mode: IdentifyMode) => void;
};

function ModeSwitcherBase({ mode, onChange }: Props) {
  const { t } = useI18n();

  const handlePress = useCallback(
    (next: IdentifyMode) => {
      if (next !== mode) {
        onChange(next);
      }
    },
    [mode, onChange]
  );

  return (
    <View style={styles.container} accessibilityRole="tablist" accessibilityLabel={t('modeSwitcher.accessibility')}>
      {OPTIONS.map((option) => {
        const selected = option.key === mode;
        const label = t(option.labelKey);
        return (
          <Pressable
            key={option.key}
            onPress={() => handlePress(option.key)}
            style={[styles.item, selected ? styles.itemSelected : null]}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={label}
          >
            <MaterialCommunityIcons
              name={selected ? option.iconFilled : option.iconOutline}
              size={18}
              color={selected ? colors.menuLink : colors.buttonText}
            />
            <Text style={[styles.label, selected ? styles.labelSelected : null]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.greenLight,
    borderWidth: 1,
    borderColor: colors.greenDark,
    borderRadius: 14,
    overflow: 'hidden',
  },
  item: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  itemSelected: {
    backgroundColor: colors.greenDark,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.buttonText,
  },
  labelSelected: {
    fontWeight: '700',
    color: colors.menuLink,
  },
});

const ModeSwitcher = memo(ModeSwitcherBase);
export default ModeSwitcher;
