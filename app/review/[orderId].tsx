import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { useAuth } from '../../contexts/AuthContext';
import { getOrder, Order, OrderItem } from '../../services/orders';
import { createReview, getReview, Review } from '../../services/reviews';
import { StarRating } from '../../components/StarRating';

// Separate component to handle key prop properly in React 19
function OrderItemRow({ item, key: _key }: { item: OrderItem; key?: string }) {
  return (
    <View style={styles.orderItem}>
      <View style={styles.orderItemLeft}>
        <View style={[styles.vegIndicator, item.isVeg ? styles.vegDot : styles.nonVegDot]} />
        <Text style={styles.orderItemName}>{item.name}</Text>
      </View>
      <View style={styles.orderItemRight}>
        <Text style={styles.orderItemQty}>x{item.quantity}</Text>
        <Text style={styles.orderItemPrice}>₹{item.price * item.quantity}</Text>
      </View>
    </View>
  );
}

export default function ReviewScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const { user, customer } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [description, setDescription] = useState('');
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!orderId) return;
      const result = await getOrder(orderId);
      if (result.success && result.data) {
        setOrder(result.data);
        // Check if already reviewed
        if (result.data.isReviewed && result.data.reviewId) {
          const reviewResult = await getReview(result.data.reviewId);
          if (reviewResult.success && reviewResult.data) {
            setExistingReview(reviewResult.data);
            setRating(reviewResult.data.rating);
            setDescription(reviewResult.data.description);
          }
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [orderId]);

  const handleRatingChange = (newRating: number) => {
    if (existingReview) return; // Don't allow changes if already reviewed
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRating(newRating);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating.');
      return;
    }
    if (!order || !user || !customer) return;

    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const reviewData: any = {
        orderId: order.id!,
        orderNumber: order.orderNumber,
        customerId: user.uid,
        customerName: customer.name || 'Anonymous',
        username: customer.username || 'user',
        restaurantId: order.restaurantId,
        restaurantName: order.restaurantName,
        rating,
        description: description.trim() || '', // Empty string if no description
        items: order.items.map(i => ({ name: i.name, quantity: i.quantity })),
      };

      // Only add photoUrl if it exists (don't send undefined to Firestore)
      // photoUrl will be added here when photo upload is implemented

      const result = await createReview(reviewData);
      
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Review Posted!', 'Thank you for your feedback.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to post review.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Write a Review</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={styles.errorText}>Order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const orderDate = order.createdAt instanceof Date 
    ? order.createdAt 
    : (order.createdAt as any)?.toDate?.() || new Date();
  const itemsSummary = order.items.map(i => `${i.quantity}x ${i.name}`).join(', ');
  const canSubmit = rating > 0 && !existingReview;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{existingReview ? 'Your Review' : 'Write a Review'}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Card - Tappable to expand */}
        <TouchableOpacity 
          style={styles.orderCard} 
          onPress={() => setShowOrderDetails(!showOrderDetails)}
          activeOpacity={0.7}
        >
          <View style={styles.orderCardHeader}>
            <View style={styles.orderCardLeft}>
              <View style={styles.restaurantIcon}>
                <Ionicons name="restaurant" size={20} color={colors.primary} />
              </View>
              <View style={styles.orderCardInfo}>
                <Text style={styles.restaurantName}>{order.restaurantName}</Text>
                <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
              </View>
            </View>
            <View style={styles.orderCardRight}>
              <Text style={styles.orderAmount}>₹{order.totalAmount}</Text>
              <Ionicons 
                name={showOrderDetails ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={colors.gray400} 
              />
            </View>
          </View>
          
          <View style={styles.orderCardMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
              <Text style={styles.metaText}>
                {orderDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
              <Text style={styles.metaText}>
                {orderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>

          {!showOrderDetails && (
            <Text style={styles.orderItemsPreview} numberOfLines={1}>{itemsSummary}</Text>
          )}
        </TouchableOpacity>

        {/* Expanded Order Details */}
        {showOrderDetails && (
          <View style={styles.orderDetails}>
            <Text style={styles.orderDetailsTitle}>Order Items</Text>
            {order.items.map((item, index) => (
              <OrderItemRow key={`item-${index}`} item={item} />
            ))}
            <View style={styles.orderTotal}>
              <Text style={styles.orderTotalLabel}>Total</Text>
              <Text style={styles.orderTotalAmount}>₹{order.totalAmount}</Text>
            </View>
          </View>
        )}

        {/* Already Reviewed Banner */}
        {existingReview && (
          <View style={styles.reviewedBanner}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.reviewedBannerText}>You've already reviewed this order</Text>
          </View>
        )}

        {/* Rating Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How was your experience?</Text>
          <View style={styles.ratingContainer}>
            <StarRating 
              rating={rating} 
              onRatingChange={handleRatingChange} 
              size={40}
              readonly={!!existingReview}
            />
          </View>
          {rating > 0 && (
            <Text style={styles.ratingLabel}>
              {rating === 5 ? 'Excellent!' : rating === 4 ? 'Great!' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
            </Text>
          )}
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tell us about your experience (Optional)</Text>
          <TextInput
            style={[styles.textInput, existingReview && styles.textInputDisabled]}
            placeholder="What did you like or dislike? How was the food quality?"
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
            editable={!existingReview}
          />
        </View>

        {/* Photo Section - Coming Soon */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Photo (Optional)</Text>
          <View style={styles.addPhotoBtn}>
            <Ionicons name="camera-outline" size={24} color={colors.textTertiary} />
            <Text style={styles.addPhotoText}>Photo upload coming soon</Text>
          </View>
        </View>

        {/* Submit Button */}
        {!existingReview && (
          <TouchableOpacity 
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitBtnText}>Post Review</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { ...textStyles.h4, color: colors.textSecondary, marginTop: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { ...textStyles.h3, color: colors.textPrimary },
  content: { flex: 1, padding: spacing.lg },
  
  // Order Card Styles
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  restaurantIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderCardInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  restaurantName: { ...textStyles.h4, color: colors.textPrimary },
  orderNumber: { ...textStyles.caption, color: colors.primary, marginTop: 2 },
  orderCardRight: {
    alignItems: 'flex-end',
  },
  orderAmount: { ...textStyles.h4, color: colors.textPrimary },
  orderCardMeta: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: { ...textStyles.caption, color: colors.textTertiary },
  orderItemsPreview: {
    ...textStyles.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  
  // Order Details Styles
  orderDetails: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  orderDetailsTitle: {
    ...textStyles.label,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  orderItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vegIndicator: {
    width: 12,
    height: 12,
    borderRadius: 2,
    borderWidth: 1.5,
    marginRight: spacing.sm,
  },
  vegDot: {
    borderColor: colors.veg,
    backgroundColor: colors.veg,
  },
  nonVegDot: {
    borderColor: colors.nonVeg,
    backgroundColor: colors.nonVeg,
  },
  orderItemName: { ...textStyles.body, color: colors.textPrimary, flex: 1 },
  orderItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  orderItemQty: { ...textStyles.body, color: colors.textSecondary },
  orderItemPrice: { ...textStyles.label, color: colors.textPrimary, minWidth: 60, textAlign: 'right' },
  orderTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  orderTotalLabel: { ...textStyles.label, color: colors.textPrimary },
  orderTotalAmount: { ...textStyles.h4, color: colors.primary },
  
  // Reviewed Banner
  reviewedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  reviewedBannerText: {
    ...textStyles.label,
    color: colors.success,
  },
  
  // Section Styles
  section: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: { ...textStyles.label, color: colors.textPrimary, marginBottom: spacing.md },
  ratingContainer: { alignItems: 'center', paddingVertical: spacing.md },
  ratingLabel: { ...textStyles.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  textInput: {
    ...textStyles.body,
    color: colors.textPrimary,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: 120,
  },
  textInputDisabled: {
    backgroundColor: colors.gray100,
    color: colors.textSecondary,
  },
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderStyle: 'dashed',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  addPhotoText: { ...textStyles.body, color: colors.textTertiary },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  submitBtnDisabled: { backgroundColor: colors.gray300 },
  submitBtnText: { ...textStyles.label, color: colors.white },
});
