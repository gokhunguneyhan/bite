import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '@/src/providers/SessionProvider';
import { Colors } from '@/src/constants/colors';
import { useSettingsStore, LANGUAGES } from '@/src/stores/settingsStore';
import { useSummaries } from '@/src/hooks/useSummary';

export default function ProfileScreen() {
  const { signOut, user, profile } = useSession();
  const { data: summaries } = useSummaries();
  const { language, setLanguage } = useSettingsStore();
  const [showLangPicker, setShowLangPicker] = useState(false);

  const currentLang = LANGUAGES.find((l) => l.code === language);
  const summaryCount = summaries?.length ?? 0;

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || '';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        {displayEmail ? (
          <Text style={styles.tier}>{displayEmail}</Text>
        ) : (
          <Text style={styles.tier}>Free Plan</Text>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{summaryCount}</Text>
          <Text style={styles.statLabel}>Summaries</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{currentLang?.label}</Text>
          <Text style={styles.statLabel}>Language</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.card}>
          <Pressable
            style={styles.cardRow}
            onPress={() => setShowLangPicker(!showLangPicker)}>
            <Ionicons name="language-outline" size={20} color={Colors.text} />
            <Text style={styles.cardRowLabel}>Summary Language</Text>
            <Text style={styles.cardRowValue}>{currentLang?.label}</Text>
            <Ionicons
              name={showLangPicker ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={Colors.tabIconDefault}
            />
          </Pressable>

          {showLangPicker && (
            <View style={styles.langPicker}>
              {LANGUAGES.map((lang) => (
                <Pressable
                  key={lang.code}
                  style={[
                    styles.langOption,
                    lang.code === language && styles.langOptionActive,
                  ]}
                  onPress={() => {
                    setLanguage(lang.code);
                    setShowLangPicker(false);
                  }}>
                  <Text
                    style={[
                      styles.langOptionText,
                      lang.code === language && styles.langOptionTextActive,
                    ]}>
                    {lang.label}
                  </Text>
                  {lang.code === language && (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={Colors.primary}
                    />
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Ionicons name="bookmark-outline" size={20} color={Colors.text} />
            <Text style={styles.cardRowLabel}>Saved Summaries</Text>
            <Text style={styles.cardRowValue}>{summaryCount}</Text>
          </View>
          <View style={styles.cardRow}>
            <Ionicons name="diamond-outline" size={20} color={Colors.text} />
            <Text style={styles.cardRowLabel}>Subscription</Text>
            <Text style={styles.cardRowValue}>Free</Text>
          </View>
        </View>
      </View>

      <Pressable style={styles.signOutButton} onPress={signOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 24,
    paddingBottom: 60,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  tier: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 8,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  cardRowLabel: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  cardRowValue: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  langPicker: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  langOptionActive: {
    backgroundColor: Colors.primary + '10',
  },
  langOptionText: {
    fontSize: 15,
    color: Colors.text,
  },
  langOptionTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  signOutButton: {
    marginTop: 32,
    padding: 18,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  signOutText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
