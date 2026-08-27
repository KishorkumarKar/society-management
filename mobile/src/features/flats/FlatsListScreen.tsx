import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { EntityListScreen } from '../../components/ui/EntityListScreen';
import { HeaderAddButton } from '../../components/ui/HeaderAddButton';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { useHasPermission } from '../../acl/PermissionGate';
import { PERMISSIONS } from '../../acl/permissions';
import { listFlats } from '../../api/endpoints/flats';
import { Flat } from '../../api/types';
import { AppStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AppStackParamList, 'Flats'>;

export function FlatsListScreen() {
  const navigation = useNavigation<Nav>();
  const { theme } = useAppTheme();
  const canCreate = useHasPermission(PERMISSIONS.FLATS_CREATE);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: canCreate ? () => <HeaderAddButton onPress={() => navigation.navigate('FlatCreate')} /> : undefined,
    });
  }, [navigation, canCreate]);

  return (
    <Screen>
      <EntityListScreen<Flat>
        queryKey="flats"
        fetchPage={(page) => listFlats({ page, limit: 20 })}
        keyExtractor={(f) => String(f.id)}
        emptyTitle="No flats yet"
        emptySubtitle="Units your committee adds will show up here."
        renderItem={(f) => (
          <Pressable onPress={() => navigation.navigate('FlatDetail', { id: f.id })}>
            <Card>
              <Text style={[styles.unit, { color: theme.text }]}>Unit {f.unit_no}</Text>
              <Text style={[styles.meta, { color: theme.textMuted }]}>
                Block {f.block} · Floor {f.floor}
                {f.owner_id ? '' : ' · No owner assigned'}
              </Text>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  unit: { fontFamily: fontFamilies.sansSemiBold, fontSize: 15 },
  meta: { fontFamily: fontFamilies.sans, fontSize: 12, marginTop: 2 },
});
