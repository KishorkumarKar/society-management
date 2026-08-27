import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { listFlats } from '../../api/endpoints/flats';
import { Flat } from '../../api/types';

interface FlatPickerProps {
  value: Flat | null;
  onChange: (flat: Flat) => void;
  label?: string;
  error?: string;
}

/**
 * The maintenance-bill create form needs a flat_id, but a bare numeric ID
 * field means someone has to already know a flat's internal ID — this
 * looks it up by unit number instead and only sends the ID.
 */
export function FlatPicker({ value, onChange, label = 'Flat', error }: FlatPickerProps) {
  const { theme } = useAppTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const query = useQuery({
    queryKey: ['flats-picker'],
    queryFn: () => listFlats({ page: 1, limit: 100 }),
    enabled: open,
  });

  const filtered = (query.data?.data ?? []).filter((f) =>
    !search.trim() || f.unit_no.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.trigger, { borderColor: error ? theme.danger : theme.border, backgroundColor: theme.surface }]}
      >
        <Text style={{ color: value ? theme.text : theme.textMuted, fontFamily: fontFamilies.sans, fontSize: 15 }}>
          {value ? `Unit ${value.unit_no}` : 'Select a flat'}
        </Text>
      </Pressable>
      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: theme.background, paddingTop: 60 }}>
          <View style={{ paddingHorizontal: 16, gap: 12 }}>
            <Text style={[styles.title, { color: theme.text }]}>Select a flat</Text>
            <TextInput
              placeholder="Search by unit number"
              placeholderTextColor={theme.textMuted}
              value={search}
              onChangeText={setSearch}
              style={[styles.search, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]}
            />
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(f) => String(f.id)}
            contentContainerStyle={{ padding: 16, gap: 8 }}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: theme.textMuted }]}>
                {query.isLoading ? 'Loading flats…' : 'No flats match.'}
              </Text>
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onChange(item);
                  setOpen(false);
                  setSearch('');
                }}
                style={[styles.row, { borderColor: theme.border, backgroundColor: theme.surface }]}
              >
                <Text style={{ color: theme.text, fontFamily: fontFamilies.sansMedium, fontSize: 15 }}>
                  Unit {item.unit_no}
                </Text>
                <Text style={{ color: theme.textMuted, fontFamily: fontFamilies.sans, fontSize: 12 }}>
                  {[item.block && `Block ${item.block}`, item.floor != null && `Floor ${item.floor}`].filter(Boolean).join(' · ') || '—'}
                </Text>
              </Pressable>
            )}
          />
          <Pressable onPress={() => setOpen(false)} style={{ padding: 16, alignItems: 'center' }}>
            <Text style={{ color: theme.primaryDark, fontFamily: fontFamilies.sansSemiBold, fontSize: 15 }}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: fontFamilies.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  trigger: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12 },
  error: { fontFamily: fontFamilies.sans, fontSize: 12 },
  title: { fontFamily: fontFamilies.display, fontSize: 20 },
  search: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontFamily: fontFamilies.sans, fontSize: 14 },
  row: { borderWidth: 1, borderRadius: 10, padding: 14, gap: 2 },
  empty: { textAlign: 'center', fontFamily: fontFamilies.sans, fontSize: 13, marginTop: 40 },
});
