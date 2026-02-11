import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  Linking,
  StyleSheet,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '@/src/providers/SessionProvider';
import { Colors } from '@/src/constants/colors';
import { useSettingsStore, LANGUAGES } from '@/src/stores/settingsStore';
import { useToast } from '@/src/components/ui/Toast';

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useSession();
  const { language, setLanguage, selectedTier } = useSettingsStore();
  const showToast = useToast();
  const [showLangPicker, setShowLangPicker] = useState(false);

  const currentLang = LANGUAGES.find((l) => l.code === language);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleDeleteData = () => {
    Alert.alert(
      'Delete My Data',
      'This will send a data deletion request to our team. Your account and all associated data will be permanently removed within 30 days. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Deletion',
          style: 'destructive',
          onPress: () => {
            Linking.openURL('mailto:support@takeabite.ai?subject=Data%20Deletion%20Request');
            showToast('Data deletion requested. Check your email for confirmation.');
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.content}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable
          style={styles.addButton}
          onPress={() => router.push('/analyse')}
          accessibilityLabel="Analyse a new video"
          accessibilityRole="button">
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.topBarTitle}>More</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <Text style={styles.sectionTitle}>Preferences</Text>
      <View style={styles.card}>
        <Pressable
          style={styles.row}
          onPress={() => setShowLangPicker(!showLangPicker)}
          accessibilityLabel="Change summary language"
          accessibilityRole="button">
          <Ionicons name="language-outline" size={20} color={Colors.text} />
          <Text style={styles.rowLabel}>Summary language</Text>
          <Text style={styles.rowValue}>{currentLang?.label}</Text>
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
                  <Ionicons name="checkmark" size={18} color={Colors.primary} />
                )}
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="diamond-outline" size={20} color={Colors.text} />
          <Text style={styles.rowLabel}>Subscription</Text>
          <Text style={styles.rowValue}>{selectedTier === 'free' ? 'Free' : selectedTier === 'pro' ? 'Pro' : 'Power'}</Text>
        </View>
        <Pressable
          style={[styles.row, styles.rowLast]}
          onPress={() => router.push('/paywall')}
          accessibilityLabel="Manage subscription"
          accessibilityRole="button">
          <Ionicons name="card-outline" size={20} color={Colors.text} />
          <Text style={styles.rowLabel}>Manage Subscription</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={Colors.tabIconDefault}
          />
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Other</Text>
      <View style={styles.card}>
        <Pressable
          style={styles.row}
          onPress={() => showToast('Coming soon')}
          accessibilityLabel="Terms of use"
          accessibilityRole="button">
          <Ionicons
            name="document-text-outline"
            size={20}
            color={Colors.text}
          />
          <Text style={styles.rowLabel}>Terms of Use</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={Colors.tabIconDefault}
          />
        </Pressable>
        <Pressable
          style={styles.row}
          onPress={() => showToast('Coming soon')}
          accessibilityLabel="Privacy policy"
          accessibilityRole="button">
          <Ionicons
            name="shield-checkmark-outline"
            size={20}
            color={Colors.text}
          />
          <Text style={styles.rowLabel}>Privacy Policy</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={Colors.tabIconDefault}
          />
        </Pressable>
        <View style={[styles.row, styles.rowLast]}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={Colors.text}
          />
          <Text style={styles.rowLabel}>App Version</Text>
          <Text style={styles.rowValue}>1.0.0</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
      <View style={styles.card}>
        <Pressable
          style={styles.row}
          onPress={handleSignOut}
          accessibilityLabel="Log out"
          accessibilityRole="button">
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={[styles.rowLabel, styles.dangerLabel]}>Log Out</Text>
        </Pressable>
        <Pressable
          style={[styles.row, styles.rowLast]}
          onPress={handleDeleteData}
          accessibilityLabel="Delete my data"
          accessibilityRole="button">
          <Ionicons name="trash-outline" size={20} color={Colors.error} />
          <Text style={[styles.rowLabel, styles.dangerLabel]}>
            Delete My Data
          </Text>
        </Pressable>
      </View>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  topBarSpacer: {
    width: 40,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 12,
  },
  dangerTitle: {
    color: Colors.error,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  rowValue: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  dangerLabel: {
    color: Colors.error,
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
});
