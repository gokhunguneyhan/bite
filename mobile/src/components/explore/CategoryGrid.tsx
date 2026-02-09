import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import { CATEGORIES } from '@/src/types/summary';

const CATEGORY_META: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  Tech: { icon: 'hardware-chip-outline', color: '#3B82F6' },
  Business: { icon: 'briefcase-outline', color: '#8B5CF6' },
  Science: { icon: 'flask-outline', color: '#06B6D4' },
  'Self-improvement': { icon: 'trending-up-outline', color: '#F97316' },
  Health: { icon: 'fitness-outline', color: '#10B981' },
  Finance: { icon: 'cash-outline', color: '#059669' },
  Education: { icon: 'school-outline', color: '#6366F1' },
  Entertainment: { icon: 'film-outline', color: '#EC4899' },
  Productivity: { icon: 'timer-outline', color: '#F59E0B' },
  Other: { icon: 'apps-outline', color: '#9CA3AF' },
};

export function CategoryGrid() {
  const categories = CATEGORIES.filter((c) => c !== 'Other');

  return (
    <View style={styles.grid}>
      {categories.map((cat) => {
        const meta = CATEGORY_META[cat] ?? CATEGORY_META.Other;
        return (
          <Pressable
            key={cat}
            style={[styles.cell, { backgroundColor: meta.color + '12' }]}
            onPress={() =>
              router.push({ pathname: '/category/[name]', params: { name: cat } })
            }
            accessibilityLabel={`Browse ${cat}`}
            accessibilityRole="button">
            <Ionicons name={meta.icon} size={24} color={meta.color} />
            <Text style={[styles.cellText, { color: meta.color }]}>{cat}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cell: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '45%',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    minHeight: 80,
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
