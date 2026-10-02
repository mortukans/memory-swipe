import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Button } from '../src/ui/components/Button';
import { Screen } from '../src/ui/components/Screen';
import { T } from '../src/ui/components/Text';
import { useTheme } from '../src/ui/theme';

export default function ResultScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const params = useLocalSearchParams<{ deleted: string; remaining: string; cancelled: string }>();
  const deleted = Number(params.deleted ?? 0);
  const remaining = Number(params.remaining ?? 0);

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: theme.spacing.lg, paddingHorizontal: theme.spacing.md }}>
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.surfaceAlt,
          }}
        >
          <Ionicons name={deleted > 0 ? 'checkmark-done' : 'sparkles-outline'} size={44} color={theme.colors.keep} />
        </View>
        <T variant="title" style={{ textAlign: 'center' }}>
          {t('result.title')}
        </T>
        <T variant="heading" tone="dim" style={{ textAlign: 'center' }}>
          {deleted > 0 ? t('result.deleted', { count: deleted }) : t('result.nothingDeleted')}
        </T>
        {remaining > 0 ? (
          <T variant="body" tone="remove" style={{ textAlign: 'center' }}>
            {t('result.someRemain', { count: remaining })}
          </T>
        ) : null}
      </View>

      <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
        {remaining > 0 ? (
          <Button label={t('review.title')} variant="secondary" icon="trash-outline" onPress={() => router.replace('/review')} />
        ) : null}
        <Button label={t('result.finish')} onPress={() => router.replace('/')} />
      </View>
    </Screen>
  );
}
