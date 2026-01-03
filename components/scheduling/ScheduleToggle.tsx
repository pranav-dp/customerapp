import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { useColors } from '../../hooks/useColors';
import { TimeSlot, formatScheduledTime } from '../../services/scheduling';

interface Props {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot | null) => void;
  slots: TimeSlot[];
}

export function ScheduleToggle({ enabled, onToggle, selectedSlot, onSelectSlot, slots }: Props) {
  const colors = useColors();
  const [showPicker, setShowPicker] = useState(false);

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.white, borderColor: colors.gray200 }]}>
        <TouchableOpacity style={styles.toggleRow} onPress={() => onToggle(!enabled)}>
          <View style={[styles.iconContainer, { backgroundColor: enabled ? colors.primaryLight : colors.gray100 }]}>
            <Ionicons name="time-outline" size={20} color={enabled ? colors.primary : colors.gray400} />
          </View>
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Schedule for later</Text>
            {enabled && selectedSlot && (
              <Text style={[styles.subtitle, { color: colors.primary }]}>{selectedSlot.label}</Text>
            )}
          </View>
          <View style={[styles.toggle, { backgroundColor: enabled ? colors.primary : colors.gray300 }]}>
            <View style={[styles.toggleKnob, { transform: [{ translateX: enabled ? 16 : 0 }] }]} />
          </View>
        </TouchableOpacity>

        {enabled && (
          <TouchableOpacity 
            style={[styles.slotBtn, { borderColor: colors.gray200 }]} 
            onPress={() => setShowPicker(true)}
          >
            <Text style={[styles.slotBtnText, { color: selectedSlot ? colors.textPrimary : colors.textTertiary }]}>
              {selectedSlot ? selectedSlot.label : 'Select time'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.gray400} />
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={showPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.white }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select Time</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.slotList}>
              {slots.map((slot, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.slotItem, selectedSlot?.label === slot.label && { backgroundColor: colors.primaryLight }]}
                  onPress={() => { onSelectSlot(slot); setShowPicker(false); }}
                >
                  <Text style={[styles.slotItemText, { color: colors.textPrimary }]}>{slot.label}</Text>
                  {selectedSlot?.label === slot.label && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
              {slots.length === 0 && (
                <Text style={[styles.noSlots, { color: colors.textSecondary }]}>No available time slots</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: borderRadius.lg, borderWidth: 1, overflow: 'hidden' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  iconContainer: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, marginLeft: spacing.sm },
  title: { ...textStyles.body, fontWeight: '500' },
  subtitle: { ...textStyles.caption, marginTop: 2 },
  toggle: { width: 44, height: 28, borderRadius: 14, padding: 2 },
  toggleKnob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
  slotBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderTopWidth: 1 },
  slotBtnText: { ...textStyles.body },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { ...textStyles.h3 },
  slotList: { padding: spacing.sm },
  slotItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.md },
  slotItemText: { ...textStyles.body },
  noSlots: { ...textStyles.body, textAlign: 'center', padding: spacing.xl },
});
